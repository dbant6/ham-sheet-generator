import { forwardRef, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { buildVCard } from '../utils/vcard.js'

/**
 * HamSheet — the printable 8.5"x11" document.
 *
 * Rendered both:
 *   1. Visibly on screen, as a live preview (scaled down).
 *   2. Off-screen at full size, to be captured by html2pdf or the browser print dialog.
 *
 * Layout priorities (in order):
 *   - CRITICAL ALERTS readable from arm's length within ~2 seconds
 *   - Medications, allergies, history scannable in a glance
 *   - QR code at bottom-right, large enough to scan from any phone
 */

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <span className="label">{label}: </span>
      <span>{value || '—'}</span>
    </div>
  )
}

function fmtDob(iso) {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}

function ageFromDob(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a >= 0 && a < 130 ? a : null
}

const HamSheet = forwardRef(function HamSheet({ data }, ref) {
  const vcard = useMemo(() => buildVCard(data), [data])
  const age = ageFromDob(data.dob)
  const generatedAt = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      }),
    [],
  )

  return (
    <div ref={ref} className="ham-sheet">
      {/* Header */}
      <header className="hs-header">
        <h1>🚨 EMERGENCY MEDICAL INFORMATION (HAM) 🚨</h1>
        <div className="hs-sub">History · Allergies · Medications</div>
      </header>

      {/* Patient Details */}
      <section className="hs-patient" aria-label="Patient details">
        <div className="hs-patient-row">
          <Field label="Name" value={data.fullName} />
          <Field label="DOB" value={`${fmtDob(data.dob)}${age != null ? ` (Age ${age})` : ''}`} />
          <Field label="Address" value={data.address} className="col-span-2" />
          <Field label="Phone" value={data.phone} />
          <Field label="Email" value={data.email} />
        </div>
      </section>

      {/* CRITICAL ALERTS — most important block */}
      <section className="hs-critical" aria-label="Critical alerts">
        <h2>⚠ Critical Alerts</h2>
        <div className="hs-critical-grid">
          <div><span className="label">DNR Status: </span>{data.dnr || 'Unknown'}</div>
          <div><span className="label">Blood Type: </span>{data.bloodType || 'Unknown'}</div>
          <div className="col-span-2"><span className="label">Preferred Hospital: </span>{data.preferredHospital || 'None'}</div>
        </div>
        <div className="allergies-row">
          <div><span className="label">Known Allergies: </span></div>
          <div className="hs-body" style={{ marginTop: 2 }}>
            {data.allergies || 'None'}
          </div>
        </div>
      </section>

      {/* Medications (violet accent) */}
      <section className="hs-section is-meds" aria-label="Current medications">
        <h2><span className="hs-emoji" aria-hidden="true">💊</span> Current Medications</h2>
        <div className="hs-body">{data.medications || 'None'}</div>
      </section>

      {/* History + PCP (teal accent) */}
      <section className="hs-section is-history" aria-label="Medical history and primary care physician">
        <h2><span className="hs-emoji" aria-hidden="true">📋</span> Medical History &amp; Primary Care Physician</h2>
        <div className="hs-body">
          <div style={{ marginBottom: 4 }}>
            <strong>PCP:</strong> {data.pcp || '—'}
          </div>
          {data.history || 'None'}
        </div>
      </section>

      {/* Emergency Contacts + Additional notes (amber accent) */}
      <section className="hs-section is-contacts" aria-label="Emergency contacts and notes">
        <h2><span className="hs-emoji" aria-hidden="true">📞</span> Emergency Contacts &amp; Notes</h2>
        <div className="hs-body">
          {data.emergencyContacts || '—'}
          {data.additionalInfo && (
            <>
              {'\n\n'}
              <strong>Additional info:</strong>{'\n'}
              {data.additionalInfo}
            </>
          )}
        </div>
      </section>

      {/* Footer with QR */}
      <footer className="hs-footer">
        <div>
          <div className="qr-label">— Scannable Emergency Data —</div>
          <div className="qr-help">
            Scan for offline medical data. Works without cell service.
            Compatible with any QR / vCard reader.
          </div>
          <div className="qr-stamp">Generated {generatedAt} · Verify info before clinical use.</div>
        </div>
        <div className="qr-box">
          <QRCodeSVG
            value={vcard}
            size={140}
            level="M"
            includeMargin={false}
            // Keep contrast strict for reliable scanning under fluorescent light.
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
      </footer>
    </div>
  )
})

export default HamSheet
