import { TextField, TextAreaField } from '../Field.jsx'

export default function StepContacts({ data, errors, set }) {
  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#80531a' }}>Contacts &amp; Notes</h2>
        <p className="text-ink-muted mt-1">Who should responders call, and what else should they know?</p>
      </header>

      <TextAreaField
        label="Emergency contacts"
        help="Provide name, relationship, and phone for at least two contacts."
        name="emergencyContacts"
        value={data.emergencyContacts}
        onChange={(v) => set('emergencyContacts', v)}
        error={errors.emergencyContacts}
        required
        rows={5}
        placeholder={`Example:\nEmily Doe — Daughter — 714-999-0928\nRobert Doe — Son — 562-555-0177`}
      />

      <TextField
        label="Preferred hospital (REQUEST ONLY)"
        help={`Note: this is a REQUEST only — paramedics may transport you to the nearest appropriate facility. If no preference, type "None".`}
        name="preferredHospital"
        value={data.preferredHospital}
        onChange={(v) => set('preferredHospital', v)}
        error={errors.preferredHospital}
      />

      <TextAreaField
        label="Additional information / special instructions"
        help={`Vital info for first responders: dietary needs, mobility, communication. Example: "Non-verbal, recent hospitalization for stroke".`}
        name="additionalInfo"
        value={data.additionalInfo}
        onChange={(v) => set('additionalInfo', v)}
        error={errors.additionalInfo}
        rows={5}
      />
    </div>
  )
}
