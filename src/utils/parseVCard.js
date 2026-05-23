/**
 * Inverse of buildVCard. Given a vCard 3.0 string (typically read out of a
 * QR code), recover as much of the form's data object as possible.
 *
 * We deliberately do NOT throw on missing or malformed fields — partial
 * recovery is more useful than all-or-nothing.
 */

function vUnescape(s = '') {
  return String(s)
    // Order matters: do \n before unescaping backslashes.
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// Unfold RFC-6350 line folding (a leading whitespace continues the previous line).
function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '')
}

function readProps(text) {
  const lines = unfold(text).replace(/\r\n/g, '\n').split('\n')
  const props = {}
  for (const line of lines) {
    if (!line.trim()) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    // Strip parameters: "TEL;TYPE=CELL" → "TEL"
    const keyPart = line.slice(0, idx)
    const key = keyPart.split(';')[0].toUpperCase()
    const val = vUnescape(line.slice(idx + 1))
    // Keep first occurrence (vCard allows duplicates; we just want one of each)
    if (!(key in props)) props[key] = val
  }
  return props
}

function parseDob(noteText) {
  // Format we emit: "DOB: MM/DD/YYYY"
  const m = noteText.match(/DOB:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return ''
  const [, mm, dd, yyyy] = m
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function captureLine(noteText, label) {
  // Matches "Label: value" up to end of line
  const re = new RegExp(`${label}:\\s*([^\\n]*)`, 'i')
  const m = noteText.match(re)
  return m ? m[1].trim() : ''
}

function captureSection(noteText, headerName) {
  // Matches "-- HEADER --\n...content..." up to the next "-- ... --" or end.
  // We escape the header in case it contains regex metachars (it shouldn't, but defensive).
  const safe = headerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`--\\s*${safe}\\s*--\\s*\\n([\\s\\S]*?)(?=\\n\\s*--\\s*[A-Z][A-Z \\-/]*\\s*--|$)`, 'i')
  const m = noteText.match(re)
  if (!m) return ''
  return m[1].replace(/\s+$/g, '').trim()
}

/**
 * @param {string} text  vCard text (BEGIN:VCARD ... END:VCARD)
 * @returns {object|null}  partial form data, or null if the text isn't a vCard
 */
export function parseVCard(text) {
  if (!text || !/BEGIN:VCARD/i.test(text)) return null
  const props = readProps(text)

  const data = {
    fullName: props.FN || props.N?.replace(/^;+|;+$/g, '').replace(/;/g, ' ').trim() || '',
    phone: props.TEL || '',
    email: props.EMAIL || '',
  }

  const note = props.NOTE || ''
  if (note) {
    data.dob = parseDob(note)
    data.address = captureLine(note, 'Address')
    data.dnr = captureLine(note, 'DNR Status')
    data.bloodType = captureLine(note, 'Blood Type')
    data.preferredHospital = captureLine(note, 'Preferred Hospital')
    data.pcp = captureLine(note, 'PCP')
    const phones = captureLine(note, 'Phone\\(s\\)')
    if (phones && phones.trim()) data.phone = phones
    data.allergies = captureSection(note, 'ALLERGIES')
    data.medications = captureSection(note, 'MEDICATIONS')
    data.history = captureSection(note, 'MEDICAL HISTORY')
    data.emergencyContacts = captureSection(note, 'EMERGENCY CONTACTS')
    data.additionalInfo = captureSection(note, 'ADDITIONAL INFO')
  }

  // Strip empty values so they don't overwrite existing form data on merge
  for (const k of Object.keys(data)) {
    if (!data[k] || (typeof data[k] === 'string' && data[k].trim() === '')) {
      delete data[k]
    }
  }
  return data
}

/**
 * Count how many fields we successfully recovered. Useful for the
 * "We filled in X fields" success message.
 */
export function countExtractedFields(partial) {
  if (!partial) return 0
  return Object.values(partial).filter(
    (v) => v != null && (typeof v !== 'string' || v.trim() !== ''),
  ).length
}
