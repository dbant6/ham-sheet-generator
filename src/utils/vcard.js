/**
 * Build a vCard 3.0 string for the QR payload.
 *
 * vCard escaping rules:
 *   - Literal newlines inside a field value are escaped as the two-char sequence "\n".
 *   - Commas, semicolons, and backslashes inside values must be escaped with "\".
 *   - Lines are terminated with CRLF. Long lines may be folded; modern parsers don't require folding.
 *
 * We deliberately put everything into the NOTE field per the spec.
 */

function vEscape(str = '') {
  return String(str)
    // 1) backslash first
    .replace(/\\/g, '\\\\')
    // 2) then commas + semicolons
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    // 3) collapse \r\n / \r to \n, then escape actual newlines to the vCard "\n" sequence
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '\\n')
}

function fmtDob(iso) {
  if (!iso) return ''
  // Show as MM/DD/YYYY for paramedic readability
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return `${m[2]}/${m[3]}/${m[1]}`
}

/**
 * @param {Object} d  the form data object
 * @returns {string}  vCard 3.0 payload, CRLF-terminated
 */
export function buildVCard(d) {
  const name = d.fullName || ''
  const note = [
    `DOB: ${fmtDob(d.dob)}`,
    `Address: ${d.address || ''}`,
    '',
    '-- CRITICAL --',
    `DNR Status: ${d.dnr || 'Unknown'}`,
    `Blood Type: ${d.bloodType || 'Unknown'}`,
    `Preferred Hospital: ${d.preferredHospital || 'None'}`,
    // PCP isn't in the spec'd vCard template but it's safer to round-trip it
    // than to lose it on re-upload. Paramedics also want to call the PCP fast.
    `PCP: ${d.pcp || ''}`,
    `Phone(s): ${d.phone || ''}`,
    '',
    '-- ALLERGIES --',
    d.allergies || 'None',
    '',
    '-- MEDICATIONS --',
    d.medications || 'None',
    '',
    '-- MEDICAL HISTORY --',
    d.history || 'None',
    '',
    '-- EMERGENCY CONTACTS --',
    d.emergencyContacts || '',
    '',
    '-- ADDITIONAL INFO --',
    d.additionalInfo || '',
  ].join('\n')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${vEscape(name)};;;`,
    `FN:${vEscape(name)}`,
    'ORG:🚨 EMERGENCY MEDICAL DATA 🚨',
    `NOTE:${vEscape(note)}`,
    d.phone ? `TEL;TYPE=CELL:${vEscape(firstNumber(d.phone))}` : null,
    d.email ? `EMAIL:${vEscape(d.email)}` : null,
    'END:VCARD',
  ].filter(Boolean)

  return lines.join('\r\n')
}

// Pull the first phone-number-looking token from a free-form string.
function firstNumber(s = '') {
  const m = String(s).match(/[+()0-9][0-9 .()-]{6,}/)
  return m ? m[0].trim() : s
}
