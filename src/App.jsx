import { useEffect, useMemo, useState } from 'react'
import { useForm } from './state/FormContext.jsx'
import { STEPS, validateStep } from './utils/validation.js'
import Stepper from './components/Stepper.jsx'
import PrivacyBanner from './components/PrivacyBanner.jsx'
import StepPatient from './components/steps/StepPatient.jsx'
import StepAlerts from './components/steps/StepAlerts.jsx'
import StepHistory from './components/steps/StepHistory.jsx'
import StepContacts from './components/steps/StepContacts.jsx'
import StepReview from './components/steps/StepReview.jsx'

const STEP_COMPONENTS = [StepPatient, StepAlerts, StepHistory, StepContacts, StepReview]

export default function App() {
  const { state, dispatch } = useForm()
  const { step, data, errors, persist } = state
  const StepComponent = STEP_COMPONENTS[step]

  const set = (name, value) => dispatch({ type: 'set_field', name, value })

  function goNext() {
    const stepErrors = validateStep(step, data)
    if (Object.keys(stepErrors).length) {
      dispatch({ type: 'set_errors', errors: stepErrors })
      // Scroll to first error
      requestAnimationFrame(() => {
        const el = document.querySelector('[aria-invalid="true"]')
        if (el && 'scrollIntoView' in el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.focus?.()
        }
      })
      return
    }
    dispatch({ type: 'set_errors', errors: {} })
    if (step < STEPS.length - 1) {
      dispatch({ type: 'set_step', step: step + 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goBack() {
    if (step > 0) {
      dispatch({ type: 'set_step', step: step - 1 })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function jumpTo(i) {
    if (i <= step) {
      dispatch({ type: 'set_step', step: i })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function reset() {
    if (confirm('Clear all entered information? This cannot be undone.')) {
      dispatch({ type: 'reset' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function togglePersist(v) {
    dispatch({ type: 'set_persist', value: v })
  }

  // Show keyboard hint to power users (Enter goes forward in single-field steps)
  const isLastStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-8 py-7 sm:py-12">
        <PrivacyBanner
          persist={persist}
          onTogglePersist={togglePersist}
          onReset={reset}
        />

        <Stepper current={step} onJump={jumpTo} />

        <form
          onSubmit={(e) => { e.preventDefault(); goNext() }}
          className="card"
          noValidate
        >
          <StepComponent data={data} errors={errors} set={set} onJump={jumpTo} />

          {!isLastStep && (
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-7 border-t border-paper-edge flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                className="btn-ghost"
                disabled={step === 0}
              >
                ← Back
              </button>
              <button type="submit" className="btn-primary">
                Continue →
              </button>
            </div>
          )}

          {isLastStep && (
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-7 border-t border-paper-edge flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button type="button" onClick={goBack} className="btn-ghost">
                ← Back to edit
              </button>
              <button
                type="button"
                onClick={reset}
                className="btn-danger-ghost"
              >
                Clear &amp; start over
              </button>
            </div>
          )}
        </form>

        <SiteFooter />
      </main>
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="border-b border-paper-edge bg-paper-card/70 backdrop-blur supports-[backdrop-filter]:bg-paper-card/60">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center gap-4">
        <HamLogo className="w-11 h-11 flex-none drop-shadow-sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-navy-800 leading-none">
            HAM Sheet
          </h1>
          <p className="text-sm text-ink-muted mt-1 tracking-wide">
            History · Allergies · Medications
          </p>
        </div>
      </div>
    </header>
  )
}

function HamLogo({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shield body */}
      <path
        d="M22 3L5 10.5V22c0 10.77 7.2 18.64 17 21 9.8-2.36 17-10.23 17-21V10.5L22 3z"
        fill="#1e3a5f"
      />
      {/* Subtle inner highlight along shield edge */}
      <path
        d="M22 6.5L8 13V22c0 9.2 6.1 16.1 14 18.4C29.9 38.1 36 31.2 36 22V13L22 6.5z"
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="1"
        fill="none"
      />
      {/* Medical cross — vertical */}
      <rect x="19" y="13" width="6" height="18" rx="3" fill="white" />
      {/* Medical cross — horizontal */}
      <rect x="13" y="19" width="18" height="6" rx="3" fill="white" />
    </svg>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-12 text-sm text-ink-muted text-center leading-relaxed">
      <p>
        Built to run offline. View source on{' '}
        <a className="underline underline-offset-4 hover:text-navy-700" href="https://github.com/dbant6/ham-sheet-generator">GitHub</a>.
      </p>
      <p className="mt-1">
        This tool does not provide medical advice. Always verify your sheet with a clinician.
      </p>
    </footer>
  )
}
