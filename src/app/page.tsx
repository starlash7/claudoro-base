export default function Home(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="terminal-card w-full max-w-xl p-6 text-center">
        <p className="terminal-kicker">Claudoro Base Miniapp</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--terminal-text)]">
          Open the app at <code>/claudoro</code>
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--terminal-muted)]">
          The miniapp route is separated so it does not conflict with other local app previews.
        </p>
        <a
          className="terminal-btn terminal-btn-primary mt-5 inline-flex px-4 py-2"
          href="/claudoro"
        >
          Launch Claudoro
        </a>
      </section>
    </main>
  )
}
