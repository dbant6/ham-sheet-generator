/**
 * Privacy assurance + optional localStorage toggle.
 *
 * compact=true  — used on step 0, where the hero already covers the privacy
 *                 promise. Shows just the toggle as a small pill row.
 * compact=false — full card with explanation; shown on all other steps where
 *                 the hero isn't present and the banner is the first thing seen.
 */
export default function PrivacyBanner({ persist, onTogglePersist, onReset, confirmingReset = false, compact = false }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-7 px-1 text-sm text-ink-muted">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => onTogglePersist(e.target.checked)}
            className="!w-4 !h-4"
          />
          <span>Save my progress on this device</span>
        </label>
        {persist && (
          <button
            type="button"
            onClick={onReset}
            className="text-alert-700 underline underline-offset-4 hover:text-alert-600 font-medium"
          >
            {confirmingReset ? 'Tap again to confirm' : 'Clear everything'}
          </button>
        )}
      </div>
    )
  }

  return (
    <section
      aria-label="Privacy"
      className="rounded-xl2 border border-ok-500/30 bg-ok-500/[0.06] p-5 sm:p-7 mb-7 sm:mb-8"
    >
      <div className="flex gap-4 sm:gap-7 items-start">
        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-ok-500/15 text-ok-600 grid place-items-center text-xl sm:text-2xl">
          🔒
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-ink leading-tight">Your information stays on this device.</h2>
          <p className="text-base text-ink-soft mt-1.5 leading-relaxed">
            This page runs entirely in your browser. There is{' '}
            <strong>no server, no database, and no tracking</strong>. Your medical
            details are never sent over the internet. When you close this tab,
            everything you typed disappears &mdash; unless you turn on the option
            below.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={persist}
                onChange={(e) => onTogglePersist(e.target.checked)}
                className="!w-5 !h-5"
              />
              <span className="text-base font-medium">
                Save my progress on this device
              </span>
            </label>
            {persist && (
              <button
                type="button"
                onClick={onReset}
                className="text-base font-medium text-alert-700 underline underline-offset-4 hover:text-alert-600"
              >
                {confirmingReset ? 'Tap again to confirm' : 'Clear everything'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
