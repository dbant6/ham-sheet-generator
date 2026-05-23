import { useRef, useState } from 'react'
import { useForm } from '../state/FormContext.jsx'
import { extractFormDataFromFile } from '../utils/extract.js'

/**
 * Quick-start: upload an existing HAM sheet PDF and pre-fill the form.
 * Works on PDFs produced by this app and on other HAM-style sheets that
 * use recognizable section headers (CRITICAL ALERTS, HISTORY, ALLERGIES,
 * MEDICATIONS, EMERGENCY CONTACTS).
 *
 * Tone here matters. The UI says "drop a file." Underneath, we extract
 * the PDF's text via pdfjs-dist and run a section-anchored parser that
 * recognizes the labels in any HAM-style sheet. The user sees only
 * "we filled in 12 fields. Review below."
 */
export default function IntakeUpload() {
  const { dispatch } = useForm()
  const fileInput = useRef(null)
  const [status, setStatus] = useState({ phase: 'idle' })
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setStatus({ phase: 'reading', message: 'Reading your file…' })
    const result = await extractFormDataFromFile(file, (msg) =>
      setStatus({ phase: 'reading', message: msg }),
    )
    if (result.ok) {
      dispatch({ type: 'merge_data', data: result.data })
      setStatus({
        phase: 'success',
        fieldsFound: result.fieldsFound,
        source: result.source,
        firstName: extractFirstName(result.data.fullName),
      })
    } else {
      setStatus({ phase: 'error', message: result.reason })
    }
  }

  function onChange(e) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // Reset so re-selecting the same file fires onChange again
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }

  const isBusy = status.phase === 'reading'
  const isSuccess = status.phase === 'success'
  const isError = status.phase === 'error'

  return (
    <section
      aria-label="Pre-fill from an existing HAM sheet"
      className={[
        'relative rounded-xl2 border p-5 sm:p-6 mb-7 transition-colors',
        isSuccess
          ? 'border-ok-500/40 bg-ok-500/[0.06]'
          : isError
            ? 'border-alert-500/40 bg-alert-50/60'
            : dragOver
              ? 'border-navy-700 bg-navy-50'
              : 'border-paper-edge bg-gradient-to-br from-[#fefcf6] to-[#fbf6ea]',
      ].join(' ')}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* Idle / dropzone */}
      {!isSuccess && (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-paper-edge text-navy-700 grid place-items-center"
          >
            <UploadIcon />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-ink leading-tight">
              Already have a HAM sheet? Start from there.
            </h3>
            <p className="text-base text-ink-muted leading-snug mt-0.5">
              Drop a PDF &mdash; we&rsquo;ll read it and fill in what we find.
              Your file stays on this device.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn-secondary w-full sm:w-auto"
              disabled={isBusy}
            >
              {isBusy ? 'Reading…' : 'Choose file'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,application/pdf,.pdf"
              onChange={onChange}
              className="sr-only"
            />
          </div>
        </div>
      )}

      {/* Reading progress */}
      {isBusy && (
        <div className="mt-4 flex items-center gap-3 text-navy-700">
          <Spinner />
          <span className="text-base font-medium">{status.message}</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="mt-3 text-base text-alert-700 leading-snug">
          {status.message}
        </p>
      )}

      {/* Success — small celebratory moment */}
      {isSuccess && (
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-ok-500/15 text-ok-600 grid place-items-center text-2xl"
          >
            ✓
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-ink leading-tight">
              {status.firstName
                ? `Welcome back, ${status.firstName}.`
                : 'Got it.'}{' '}
              <span className="text-ok-600">
                We filled in {status.fieldsFound} field{status.fieldsFound === 1 ? '' : 's'}.
              </span>
            </h3>
            <p className="text-base text-ink-muted mt-1 leading-snug">
              {status.source === 'metadata'
                ? 'Loaded straight from the data saved inside your previous sheet — every field came across cleanly. Review and update anything that has changed.'
                : status.source === 'qr'
                  ? 'Read from the QR code on your sheet. Please review the details and update anything that has changed.'
                  : 'Read from the text of your PDF. Please review carefully — anything that needs correcting is just a tap away.'}
            </p>
            <button
              type="button"
              onClick={() => setStatus({ phase: 'idle' })}
              className="mt-3 text-base font-medium text-navy-700 underline underline-offset-4 hover:text-navy-800"
            >
              Upload a different file
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function extractFirstName(full) {
  if (!full) return ''
  return String(full).trim().split(/\s+/)[0] || ''
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
