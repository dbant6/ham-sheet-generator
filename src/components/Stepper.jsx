import { STEPS } from '../utils/validation.js'

/**
 * Visual stepper. Click a completed step to jump back; future steps are locked.
 * Designed to be very obvious — no abstract icons, just numbers + names.
 */
export default function Stepper({ current, onJump }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const state =
            i < current ? 'done' : i === current ? 'current' : 'upcoming'
          const clickable = i <= current
          return (
            <li key={s.id} className="flex items-center">
              <button
                type="button"
                onClick={() => clickable && onJump(i)}
                disabled={!clickable}
                className={[
                  'flex items-center gap-2 rounded-full px-3.5 py-2 text-base font-semibold transition-colors',
                  state === 'current' && 'bg-navy-700 text-white shadow-card',
                  state === 'done' && 'bg-navy-50 text-navy-700 hover:bg-navy-100',
                  state === 'upcoming' && 'bg-paper-edge/50 text-ink-muted cursor-default',
                ].filter(Boolean).join(' ')}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span
                  className={[
                    'inline-flex items-center justify-center rounded-full w-7 h-7 text-sm',
                    state === 'current' && 'bg-white text-navy-700',
                    state === 'done' && 'bg-navy-700 text-white',
                    state === 'upcoming' && 'bg-white text-ink-muted',
                  ].filter(Boolean).join(' ')}
                >
                  {state === 'done' ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.shortTitle}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="hidden sm:inline mx-1 text-paper-edge">
                  —
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
