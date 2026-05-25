import { useLayoutEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import HamSheet from '../HamSheet.jsx'
import { CheckboxField } from '../Field.jsx'
import { downloadPdf, suggestFilename } from '../../utils/pdf.js'

// 8.5 inch sheet width at the 96-DPI CSS-pixel convention used by browsers.
const SHEET_WIDTH_PX = 8.5 * 96 // = 816

/**
 * Dynamically scale the off-screen 8.5"-wide sheet to fit the visible
 * container — so the same component is paramedic-perfect at full-bleed
 * and still readable on a 375px phone. Listens to ResizeObserver so it
 * stays correct as the user rotates the device.
 */
function useResponsiveScale(maxScale = 1) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(0.78)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth
      if (!w) return
      const next = Math.min(maxScale, Math.max(0.28, w / SHEET_WIDTH_PX))
      setScale(next)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    window.addEventListener('orientationchange', compute)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', compute)
    }
  }, [maxScale])
  return { containerRef, scale }
}

/**
 * Review & Generate.
 *
 * Layout:
 *   - Summary cards of everything entered (read-only)
 *   - Consent checkbox (required)
 *   - Once consented: live preview of the printable sheet + Download/Print buttons.
 */

const SECTIONS = [
  {
    title: 'About you',
    rows: [
      ['Full name', 'fullName'],
      ['Date of birth', 'dob'],
      ['Address', 'address'],
      ['Phone', 'phone'],
      ['Email', 'email'],
    ],
  },
  {
    title: 'Critical alerts',
    rows: [
      ['DNR', 'dnr'],
      ['Blood type', 'bloodType'],
      ['Primary Care Physician', 'pcp'],
    ],
  },
  {
    title: 'Medical',
    rows: [
      ['History', 'history'],
      ['Allergies', 'allergies'],
      ['Medications', 'medications'],
    ],
  },
  {
    title: 'Contacts & notes',
    rows: [
      ['Emergency contacts', 'emergencyContacts'],
      ['Preferred hospital', 'preferredHospital'],
      ['Additional info', 'additionalInfo'],
    ],
  },
]

function fmtDob(iso) {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}

function SummaryRow({ label, value, isDob }) {
  const display = isDob ? fmtDob(value) : value
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-x-4 gap-y-0.5 py-2.5 border-b border-paper-edge/60 last:border-0">
      <div className="text-ink-muted font-medium text-base">{label}</div>
      <div className="text-ink whitespace-pre-wrap break-words text-base">
        {display && String(display).trim() ? display : <span className="text-ink-muted/70">—</span>}
      </div>
    </div>
  )
}

export default function StepReview({ data, errors, set, onJump }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [saved, setSaved] = useState(false)
  const printRef = useRef(null)
  const { containerRef, scale } = useResponsiveScale(0.85)

  const print = useReactToPrint({
    content: () => printRef.current,
    documentTitle: suggestFilename(data.fullName).replace(/\.pdf$/, ''),
    onAfterPrint: () => setSaved(true),
  })

  async function handleDownload() {
    setErr(null)
    setBusy(true)
    try {
      // Pass the form data so the generator can embed it in PDF metadata —
      // that's how a re-uploaded copy of this sheet pre-fills the form
      // perfectly, even though the page itself is rasterized.
      await downloadPdf(printRef.current, suggestFilename(data.fullName), data)
      setSaved(true)
    } catch (e) {
      console.error(e)
      setErr('Sorry, something went wrong generating the PDF. You can use the Print button to save as PDF instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-700">Review &amp; Generate</h2>
        <p className="text-ink-muted mt-1">Double-check everything below. When you're happy, tick the consent box and download your sheet.</p>
      </header>

      {/* Summary */}
      <div className="space-y-5">
        {SECTIONS.map((s, idx) => (
          <div key={s.title} className="rounded-xl border border-paper-edge bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-navy-700">{s.title}</h3>
              <button
                type="button"
                onClick={() => onJump(idx)}
                className="text-base font-medium text-navy-700 underline underline-offset-4 hover:text-navy-800"
              >
                Edit
              </button>
            </div>
            <div>
              {s.rows.map(([label, key]) => (
                <SummaryRow key={key} label={label} value={data[key]} isDob={key === 'dob'} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Consent */}
      <CheckboxField
        label="I consent that this information is accurate and agree to release it to first responders."
        help="Required. By checking this box, you confirm the details above are correct to the best of your knowledge and may be shared with paramedics, ER staff, and other first responders."
        name="consent"
        value={data.consent}
        onChange={(v) => set('consent', v)}
        error={errors.consent}
        required
      />

      {/* Action buttons + preview, gated on consent */}
      {data.consent ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary w-full sm:w-auto"
              disabled={busy}
            >
              {busy ? 'Generating…' : '⬇ Download HAM Sheet (PDF)'}
            </button>
            <button
              type="button"
              onClick={print}
              className="btn-secondary w-full sm:w-auto"
              disabled={busy}
            >
              🖨 Print directly
            </button>
          </div>
          {err && (
            <p className="text-alert-700 font-medium text-base">{err}</p>
          )}

          {/* Post-save guidance — shown after first download or print */}
          {saved && (
            <div className="rounded-xl border border-ok-500/30 bg-ok-500/[0.06] p-5 sm:p-6">
              <div className="flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-ink leading-tight">Your sheet is saved — here's what to do next</h3>
                  <p className="text-base text-ink-soft mt-1 mb-4 leading-relaxed">
                    The sheet only helps if it's somewhere paramedics can find it. Here are the most effective places to put it:
                  </p>
                  <ul className="space-y-2.5 text-base text-ink-soft">
                    <li className="flex gap-2.5">
                      <span aria-hidden="true">📌</span>
                      <span><strong className="text-ink">Print and post on the fridge.</strong> The inside of the front door or the fridge door is the first place paramedics look.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden="true">👜</span>
                      <span><strong className="text-ink">Fold a copy in your wallet or purse.</strong> Useful if you're away from home when help is needed.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden="true">📱</span>
                      <span><strong className="text-ink">Email a copy to your emergency contacts.</strong> So they have it too and can share it with medical staff.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden="true">🏥</span>
                      <span><strong className="text-ink">Bring a copy to your next doctor's appointment.</strong> Your PCP can verify the medications and history are current.</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-ink-muted">
                    Update this sheet once a year, or after any new diagnosis, medication change, or surgery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live preview — scales fluidly from phone to desktop */}
          <div>
            <h3 className="text-xl font-semibold text-navy-700 mb-3">Preview</h3>
            <div
              ref={containerRef}
              className="rounded-xl2 border border-paper-edge bg-paper-edge/30 p-3 sm:p-5 overflow-hidden"
            >
              <div
                className="origin-top mx-auto"
                style={{
                  width: `${SHEET_WIDTH_PX}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  // Reserve only the visible (scaled) height — keeps the card
                  // from leaving a giant empty gutter underneath.
                  height: `${SHEET_WIDTH_PX * (11 / 8.5) * scale}px`,
                }}
              >
                <HamSheet ref={printRef} data={data} />
              </div>
            </div>
            <p className="text-sm text-ink-muted mt-2 text-center">
              Preview scaled to fit — the PDF will be full 8.5×11&quot;.
            </p>
          </div>
        </div>
      ) : (
        // Before consent, keep the off-screen sheet mounted so the QR + ref are ready.
        <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}>
          <HamSheet ref={printRef} data={data} />
        </div>
      )}
    </div>
  )
}
