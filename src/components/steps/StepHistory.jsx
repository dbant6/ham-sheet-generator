import { TextAreaField } from '../Field.jsx'

export default function StepHistory({ data, errors, set }) {
  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f5e58' }}>History &amp; Medications</h2>
        <p className="text-ink-muted mt-1">Be thorough — one drug interaction or missed condition can matter a lot. If a section truly doesn't apply, type "None".</p>
      </header>

      <TextAreaField
        label="Medical history"
        help="List all significant past and current medical conditions, surgeries, and chronic illnesses."
        name="history"
        value={data.history}
        onChange={(v) => set('history', v)}
        error={errors.history}
        required
        rows={6}
        placeholder={`Example:\n• Hypertension (since 2014)\n• Type 2 Diabetes (since 2018)\n• Total knee replacement, R knee (2021)`}
      />

      <TextAreaField
        label="Allergies"
        help={`List all known allergies: medications, food, environmental — and describe the reaction. Example: "Peanut butter — severe difficulty breathing — HIVES". If none, type "None".`}
        name="allergies"
        value={data.allergies}
        onChange={(v) => set('allergies', v)}
        error={errors.allergies}
        required
        rows={6}
        placeholder={`Example:\nPENICILLIN — rash, swelling\nSHELLFISH — anaphylaxis (carry EpiPen)`}
      />

      <TextAreaField
        label="Medications"
        help={`List ALL medications you currently take — name, dosage, frequency. Example: "ATORVASTATIN — 5mg — Twice Daily".`}
        name="medications"
        value={data.medications}
        onChange={(v) => set('medications', v)}
        error={errors.medications}
        required
        rows={6}
        placeholder={`Example:\nMETFORMIN — 500mg — Twice Daily with meals\nLISINOPRIL — 10mg — Once Daily AM\nWARFARIN — 5mg — Once Daily PM`}
      />
    </div>
  )
}
