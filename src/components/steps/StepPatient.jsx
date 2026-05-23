import { TextField } from '../Field.jsx'
import IntakeUpload from '../IntakeUpload.jsx'

export default function StepPatient({ data, errors, set }) {
  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-700">About You</h2>
        <p className="text-ink-muted mt-1">Start with the basics. These appear at the top of your HAM sheet so paramedics can verify identity quickly.</p>
      </header>

      <IntakeUpload />

      <TextField
        label="Full legal name of resident"
        help="Your full name as it appears on official ID. Example: Jane Marie Doe."
        name="fullName"
        value={data.fullName}
        onChange={(v) => set('fullName', v)}
        error={errors.fullName}
        required
        autoComplete="name"
      />

      <TextField
        label="Date of birth"
        help="Used to verify identity in an emergency."
        name="dob"
        type="date"
        value={data.dob}
        onChange={(v) => set('dob', v)}
        error={errors.dob}
        required
        autoComplete="bday"
      />

      <TextField
        label="Current residential address"
        help={`Include unit number. Example: "1234 Golden Rain — Unit 44A".`}
        name="address"
        value={data.address}
        onChange={(v) => set('address', v)}
        error={errors.address}
        required
        autoComplete="street-address"
      />

      <TextField
        label="Phone number(s)"
        help={`Example: "562-444-8621 Jane Doe (Self)" or "714-999-0928 Emily Doe — Daughter".`}
        name="phone"
        value={data.phone}
        onChange={(v) => set('phone', v)}
        error={errors.phone}
        required
        autoComplete="tel"
      />

      <TextField
        label="Email address"
        help={`Example: "janedoe65@gmail.com". Optional but recommended.`}
        name="email"
        type="email"
        value={data.email}
        onChange={(v) => set('email', v)}
        error={errors.email}
        autoComplete="email"
      />
    </div>
  )
}
