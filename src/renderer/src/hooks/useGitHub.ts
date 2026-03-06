import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

interface GitHubIssue {
  pull_request?: unknown
}

interface RepoTarget {
  owner: string
  repo: string
}

export interface GitHubContributionDay {
  date: string
  count: number
}

interface GitHubMetrics {
  todayCommits: number
  weeklyContributions: number[]
  contributionDays: GitHubContributionDay[]
  openPRs: number
  openIssues: number
}

export type GitHubErrorCode =
  | 'auth'
  | 'forbidden'
  | 'rate_limit'
  | 'not_found'
  | 'network'
  | 'unknown'

interface UseGitHubResult {
  metrics: GitHubMetrics
  loading: boolean
  error: string | null
  errorCode: GitHubErrorCode | null
  lastUpdated: number | null
  refresh: () => Promise<void>
}

const CACHE_TTL_MS = 5 * 60 * 1000
const REFRESH_INTERVAL_MS = 15 * 60 * 1000

const queryCache = new Map<string, { expiresAt: number; value: unknown }>()

const emptyMetrics: GitHubMetrics = {
  todayCommits: 0,
  weeklyContributions: [0, 0, 0, 0, 0, 0, 0],
  contributionDays: [],
  openPRs: 0,
  openIssues: 0
}

const toLocalDateKey = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const buildDateKeysBetween = (start: Date, end: Date): string[] => {
  const keys: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    keys.push(toLocalDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

const getContributionRange = (): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const getCached = <T>(key: string): T | null => {
  const hit = queryCache.get(key)

  if (!hit) {
    return null
  }

  if (Date.now() > hit.expiresAt) {
    queryCache.delete(key)
    return null
  }

  return hit.value as T
}

const setCached = <T>(key: string, value: T): T => {
  queryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  })

  return value
}

const fetchWithCache = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  const cached = getCached<T>(key)

  if (cached !== null) {
    return cached
  }

  const value = await fetcher()
  return setCached(key, value)
}

class GitHubRequestError extends Error {
  code: GitHubErrorCode
  status: number

  constructor(code: GitHubErrorCode, status: number, message: string) {
    super(message)
    this.code = code
    this.status = status
  }
}

interface GraphQLErrorPayload {
  message?: string
}

interface GraphQLResponsePayload<T> {
  data?: T
  errors?: GraphQLErrorPayload[]
}

const getErrorCodeByResponse = (response: Response): GitHubErrorCode => {
  if (response.status === 401) {
    return 'auth'
  }

  if (response.status === 404) {
    return 'not_found'
  }

  if (response.status === 403) {
    const limitRemaining = response.headers.get('x-ratelimit-remaining')
    return limitRemaining === '0' ? 'rate_limit' : 'forbidden'
  }

  return 'unknown'
}

const parseGitHubErrorMessage = async (
  response: Response,
  fallback: string
): Promise<{ code: GitHubErrorCode; message: string }> => {
  const code = getErrorCodeByResponse(response)
  const contentType = response.headers.get('content-type') ?? ''
  let rawMessage = ''

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { message?: string }
      rawMessage = payload.message?.trim() ?? ''
    } catch {
      rawMessage = ''
    }
  } else {
    rawMessage = (await response.text()).trim()
  }

  if (rawMessage) {
    return {
      code,
      message: rawMessage
    }
  }

  if (code === 'auth') {
    return { code, message: 'GitHub token is invalid or expired. Please reconnect in Settings.' }
  }

  if (code === 'rate_limit') {
    return { code, message: 'GitHub API rate limit reached. Try again later.' }
  }

  if (code === 'not_found') {
    return { code, message: 'Repository or username not found. Check your GitHub settings.' }
  }

  if (code === 'forbidden') {
    return { code, message: 'GitHub access is forbidden for this token or repository.' }
  }

  return { code, message: fallback }
}

const fetchGitHubJSON = async <T>(url: string, token: string): Promise<T> => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const parsed = await parseGitHubErrorMessage(
        response,
        `GitHub API request failed (${response.status})`
      )
      throw new GitHubRequestError(parsed.code, response.status, parsed.message)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof GitHubRequestError) {
      throw error
    }

    throw new GitHubRequestError(
      'network',
      0,
      'Unable to reach GitHub API. Check network and retry.'
    )
  }
}

const getErrorCodeByMessage = (message: string): GitHubErrorCode => {
  const normalized = message.toLowerCase()

  if (normalized.includes('bad credentials') || normalized.includes('requires authentication')) {
    return 'auth'
  }

  if (normalized.includes('rate limit')) {
    return 'rate_limit'
  }

  if (normalized.includes('could not resolve') || normalized.includes('not found')) {
    return 'not_found'
  }

  if (normalized.includes('forbidden') || normalized.includes('resource not accessible')) {
    return 'forbidden'
  }

  return 'unknown'
}

const fetchGitHubGraphQL = async <T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> => {
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
      const parsed = await parseGitHubErrorMessage(
        response,
        `GitHub GraphQL request failed (${response.status})`
      )
      throw new GitHubRequestError(parsed.code, response.status, parsed.message)
    }

    const payload = (await response.json()) as GraphQLResponsePayload<T>

    if (payload.errors?.length) {
      const message = payload.errors[0]?.message?.trim() || 'GitHub GraphQL request failed.'
      throw new GitHubRequestError(getErrorCodeByMessage(message), response.status, message)
    }

    if (!payload.data) {
      throw new GitHubRequestError('unknown', response.status, 'GitHub GraphQL returned no data.')
    }

    return payload.data
  } catch (error) {
    if (error instanceof GitHubRequestError) {
      throw error
    }

    throw new GitHubRequestError(
      'network',
      0,
      'Unable to reach GitHub API. Check network and retry.'
    )
  }
}

const tokenCacheKey = (token: string): string => {
  if (!token) {
    return 'none'
  }

  const head = token.slice(0, 3)
  const tail = token.slice(-3)
  return `${token.length}:${head}:${tail}`
}

const fetchTodayCommits = async (
  repoOwner: string,
  repo: string,
  author: string,
  token: string
): Promise<number> => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    since: start.toISOString(),
    until: end.toISOString(),
    author,
    per_page: '100'
  })

  const url = `https://api.github.com/repos/${repoOwner}/${repo}/commits?${params.toString()}`
  const authKey = tokenCacheKey(token)

  return fetchWithCache(`today-commits:${repoOwner}:${repo}:${author}:${authKey}`, async () => {
    const commits = await fetchGitHubJSON<Array<{ sha: string }>>(url, token)
    return commits.length
  })
}

const parseRepoTarget = (value: string, fallbackOwner: string): RepoTarget | null => {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '')

  if (!normalized) {
    return null
  }

  const segments = normalized.split('/').filter(Boolean)

  if (segments.length === 1) {
    return {
      owner: fallbackOwner,
      repo: segments[0]
    }
  }

  if (segments.length === 2) {
    return {
      owner: segments[0],
      repo: segments[1]
    }
  }

  return null
}

interface ContributionCalendarQuery {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            date: string
            contributionCount: number
          }>
        }>
      }
    }
  } | null
}

interface ContributionSnapshot {
  weeklyContributions: number[]
  contributionDays: GitHubContributionDay[]
}

const fetchContributions = async (
  username: string,
  token: string
): Promise<ContributionSnapshot> => {
  const { start, end } = getContributionRange()
  const fullDateKeys = buildDateKeysBetween(start, end)
  const weeklyDateKeys = fullDateKeys.slice(-7)
  const authKey = tokenCacheKey(token)
  const rangeKey = `${toLocalDateKey(start)}:${toLocalDateKey(end)}`

  return fetchWithCache(`contrib-snapshot:${username}:${rangeKey}:${authKey}`, async () => {
    const response = await fetchGitHubGraphQL<ContributionCalendarQuery>(
      `query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }`,
      {
        login: username,
        from: start.toISOString(),
        to: end.toISOString()
      },
      token
    )

    if (!response.user) {
      throw new GitHubRequestError(
        'not_found',
        404,
        'GitHub user not found. Check your connection settings.'
      )
    }

    const contributionsByDate = new Map<string, number>()

    response.user.contributionsCollection.contributionCalendar.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        contributionsByDate.set(day.date, day.contributionCount)
      })
    })

    const contributionDays = fullDateKeys.map((key) => ({
      date: key,
      count: contributionsByDate.get(key) ?? 0
    }))

    const weeklyContributions = weeklyDateKeys.map((key) => contributionsByDate.get(key) ?? 0)

    return {
      weeklyContributions,
      contributionDays
    }
  })
}

const fetchOpenPRs = async (repoOwner: string, repo: string, token: string): Promise<number> => {
  const url = `https://api.github.com/repos/${repoOwner}/${repo}/pulls?state=open&per_page=100`
  const authKey = tokenCacheKey(token)

  return fetchWithCache(`open-prs:${repoOwner}:${repo}:${authKey}`, async () => {
    const pulls = await fetchGitHubJSON<Array<{ id: number }>>(url, token)
    return pulls.length
  })
}

const fetchOpenIssues = async (repoOwner: string, repo: string, token: string): Promise<number> => {
  const url = `https://api.github.com/repos/${repoOwner}/${repo}/issues?state=open&per_page=100`
  const authKey = tokenCacheKey(token)

  return fetchWithCache(`open-issues:${repoOwner}:${repo}:${authKey}`, async () => {
    const issues = await fetchGitHubJSON<GitHubIssue[]>(url, token)
    return issues.filter((issue) => !issue.pull_request).length
  })
}

export const useGitHub = (): UseGitHubResult => {
  const githubMode = useSettingsStore((state) => state.githubMode)
  const githubToken = useSettingsStore((state) => state.githubToken)
  const githubUsername = useSettingsStore((state) => state.githubUsername)
  const githubRepo = useSettingsStore((state) => state.githubRepo)
  const isGitHubEnabled = useSettingsStore((state) => state.isGitHubEnabled)

  const [metrics, setMetrics] = useState<GitHubMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<GitHubErrorCode | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const isReady = useMemo(
    () =>
      isGitHubEnabled &&
      Boolean(githubToken && githubUsername && (githubMode === 'account' || githubRepo)),
    [isGitHubEnabled, githubMode, githubToken, githubUsername, githubRepo]
  )

  const refresh = useCallback(async () => {
    if (!isReady) {
      setMetrics(emptyMetrics)
      setError(null)
      setErrorCode(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      const contributionSnapshot = await fetchContributions(githubUsername, githubToken)
      const { weeklyContributions, contributionDays } = contributionSnapshot
      const todayContributions = weeklyContributions[weeklyContributions.length - 1] ?? 0

      if (githubMode === 'account') {
        setMetrics({
          todayCommits: todayContributions,
          weeklyContributions,
          contributionDays,
          openPRs: 0,
          openIssues: 0
        })
        setLastUpdated(Date.now())
        return
      }

      const repoTarget = parseRepoTarget(githubRepo, githubUsername)

      if (!repoTarget) {
        throw new GitHubRequestError(
          'not_found',
          404,
          'Repository is missing. Open Settings and reconnect GitHub.'
        )
      }

      const [todayCommits, openPRs, openIssues] = await Promise.all([
        fetchTodayCommits(repoTarget.owner, repoTarget.repo, githubUsername, githubToken),
        fetchOpenPRs(repoTarget.owner, repoTarget.repo, githubToken),
        fetchOpenIssues(repoTarget.owner, repoTarget.repo, githubToken)
      ])

      setMetrics({
        todayCommits,
        weeklyContributions,
        contributionDays,
        openPRs,
        openIssues
      })
      setLastUpdated(Date.now())
    } catch (requestError) {
      if (requestError instanceof GitHubRequestError) {
        setErrorCode(requestError.code)
        setError(requestError.message)
      } else {
        setErrorCode('unknown')
        setError(
          requestError instanceof Error ? requestError.message : 'Failed to load GitHub data.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [isReady, githubMode, githubToken, githubUsername, githubRepo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isReady) {
      return
    }

    const interval = window.setInterval(() => {
      void refresh()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [isReady, refresh])

  return {
    metrics,
    loading,
    error,
    errorCode,
    lastUpdated,
    refresh
  }
}
