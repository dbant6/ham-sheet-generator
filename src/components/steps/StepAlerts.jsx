import { RadioGroupField, SelectField, TextField } from '../Field.jsx'

const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown',
]

export default function StepAlerts({ data, errors, set }) {
  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-700">Critical Alerts</h2>
        <p className="text-ink-muted mt-1">These are the first things paramedics check. We highlight them at the top of your sheet in a red callout.</p>
      </header>

      <RadioGroupField
        label="Do Not Resuscitate (DNR) order in place?"
        help="Choose Unknown if you aren't sure — that is far better than guessing."
        name="dnr"
        value={data.dnr}
        onChange={(v) => set('dnr', v)}
        options={['Yes', 'No', 'Unknown']}
        error={errors.dnr}
        required
      />

      <SelectField
        label="Blood type"
        help="If you don't know, choose Unknown."
        name="bloodType"
        value={data.bloodType}
        onChange={(v) => set('bloodType', v)}
        options={BLOOD_TYPES}
        error={errors.bloodType}
        required
      />

      <TextField
        label="Primary Care Physician (PCP) — name and phone"
        help={`Example: "Dr. Sarah Chen — 562-555-0142".`}
        name="pcp"
        value={data.pcp}
        onChange={(v) => set('pcp', v)}
        error={errors.pcp}
      />
    </div>
  )
}
