export default function Titlebar(): React.JSX.Element {
  return (
    <header className="titlebar grid h-12 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--terminal-border)] px-3 sm:px-4">
      <div className="flex items-center">
        <span className="terminal-footer-note">BASE MINIAPP</span>
      </div>

      <div className="terminal-app-title">Claudoro</div>

      <div className="flex items-center justify-end">
        <span className="terminal-footer-note">FOCUS TIMER</span>
      </div>
    </header>
  )
}
