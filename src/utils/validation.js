/**
 * Lightweight per-step validation. We deliberately keep the bar low —
 * only the truly-required fields block forward progress, with friendly
 * error messages.
 */

export const STEPS = [
  { id: 'patient',  title: 'About You',           shortTitle: 'You'        },
  { id: 'alerts',   title: 'Critical Alerts',     shortTitle: 'Alerts'     },
  { id: 'history',  title: 'History & Medications', shortTitle: 'Medical'  },
  { id: 'contacts', title: 'Contacts & Notes',    shortTitle: 'Contacts'   },
  { id: 'review',   title: 'Review & Generate',   shortTitle: 'Generate'   },
]

const REQUIRED_PER_STEP = {
  0: ['fullName', 'dob', 'address', 'phone'],
  1: ['dnr', 'bloodType'],
  2: ['history', 'allergies', 'medications'],
  3: ['emergencyContacts'],
  4: ['consent'],
}

const FRIENDLY = {
  fullName: 'Please enter your full legal name.',
  dob: 'Please enter your date of birth.',
  address: 'Please enter your residential address.',
  phone: 'Please enter at least one phone number.',
  dnr: 'Please choose Yes, No, or Unknown.',
  bloodType: 'Please choose a blood type (or "Unknown").',
  history: 'Please list your medical history, or type "None".',
  allergies: 'Please list your allergies, or type "None".',
  medications: 'Please list your medications, or type "None".',
  emergencyContacts: 'Please add at least one emergency contact.',
  consent: 'Please tick the consent box to continue.',
}

export function validateStep(stepIndex, data) {
  const required = REQUIRED_PER_STEP[stepIndex] || []
  const errors = {}
  for (const key of required) {
    const v = data[key]
    if (key === 'consent') {
      if (!v) errors[key] = FRIENDLY[key]
    } else if (!v || (typeof v === 'string' && v.trim() === '')) {
      errors[key] = FRIENDLY[key]
    }
  }
  return errors
}

export function isStepValid(stepIndex, data) {
  return Object.keys(validateStep(stepIndex, data)).length === 0
}
