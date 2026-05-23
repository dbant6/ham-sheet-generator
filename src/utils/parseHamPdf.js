/**
 * Flexible HAM-sheet PDF text parser.
 *
 * Goal: given the plain text pdfjs-dist extracts from any HAM-style sheet
 * (the LW Seal Beach style, our own generated style, or something close to
 * either), recover as many form fields as we can.
 *
 * Strategy: section-anchored. We first split the document by known section
 * headers (CRITICAL ALERTS, HISTORY, ALLERGIES, MEDICATIONS, EMERGENCY
 * CONTACTS). Within each section we look for known row labels (DNR Status,
 * Blood Type, Preferred Hospital, Primary Care Physician, Past/Current
 * Conditions, Allergies, Medications & Dosages, Contacts, Additional Info).
 *
 * Everything is case-insensitive and tolerant of optional colons / dashes
 * after labels. Whitespace is heavily normalized first so that PDF
 * column-wrapped text behaves like a single string.
 */

// -----------------------------------------------------------------------------
// Normalization
// -----------------------------------------------------------------------------

function normalizeText(raw) {
  return String(raw || '')
    .replace(/​/g, '')                          // zero-width space
    .replace(/[  -   　]/g, ' ') // non-breaking + thin spaces
    .replace(/\r\n?/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
}

// Build a regex that matches any of the anchor phrases as whole words.
function anchorRegex(anchors, flags = 'i') {
  const alt = anchors.map(escRe).join('|')
  return new RegExp(`\\b(?:${alt})\\b`, flags)
}

// Return the index AFTER the first occurrence of any startAnchors,
// and the index of the next endAnchor after that. Returns null if not found.
function locateSection(text, startAnchors, endAnchors) {
  const startRe = anchorRegex(startAnchors)
  const sm = startRe.exec(text)
  if (!sm) return null
  const contentStart = sm.index + sm[0].length

  if (!endAnchors?.length) {
    return { start: contentStart, end: text.length }
  }
  const endRe = anchorRegex(endAnchors)
  endRe.lastIndex = contentStart
  // Build a regex with the global flag so we can use lastIndex.
  const g = new RegExp(endRe.source, endRe.flags + 'g')
  g.lastIndex = contentStart
  const em = g.exec(text)
  return { start: contentStart, end: em ? em.index : text.length }
}

function sectionContent(text, startAnchors, endAnchors) {
  const loc = locateSection(text, startAnchors, endAnchors)
  if (!loc) return ''
  return text.slice(loc.start, loc.end).trim()
}

function stripLeadingLabel(text, labels) {
  let t = (text || '').trim()
  for (const label of labels) {
    const re = new RegExp(`^${escRe(label)}\\s*[:\\-]?\\s*`, 'i')
    if (re.test(t)) {
      t = t.replace(re, '').trim()
      break
    }
  }
  return t
}

function normalizeDate(s) {
  if (!s) return ''
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return ''
  let [, mm, dd, yy] = m
  if (yy.length === 2) yy = (+yy < 30 ? '20' : '19') + yy
  return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function normalizeYN(s) {
  const v = String(s || '').toUpperCase().trim()
  if (v === 'Y' || v === 'YES') return 'Yes'
  if (v === 'N' || v === 'NO') return 'No'
  if (v.startsWith('UNK')) return 'Unknown'
  return ''
}

function normalizeBlood(s) {
  if (!s) return ''
  const cleaned = s.replace(/\s+/g, '').toUpperCase()
  if (/^(A|B|AB|O)[+-]$/.test(cleaned)) return cleaned
  if (cleaned === 'UNKNOWN') return 'Unknown'
  return ''
}

// -----------------------------------------------------------------------------
// Section parsers
// -----------------------------------------------------------------------------

// All the row-label phrases that mean "this is the end of the previous value".
// Used as lookahead boundaries inside section content.
const ROW_LABEL_BOUNDARIES = [
  'DNR\\s+Status', 'DNR',
  'Blood\\s+Type', 'Blood\\s+Thinners\\??',
  'Preferred\\s+Hospital',
  'Primary\\s+Care\\s+Physician', 'Primary\\s+Care', 'PCP',
  'Past\\/Current\\s+Conditions',
  'Medical\\s+History',
  'Allergies',
  'Medications\\s*&\\s*Dosages', 'Medications\\s+and\\s+Dosages',
  'Current\\s+Medications', 'Medications',
  'Emergency\\s+Contacts', 'Contacts',
  'Additional\\s+Info(?:rmation)?', 'Additional\\s+Notes?',
  'Phone(?:\\(s\\)|s|\\s+Number)?', 'Email',
  'CRITICAL\\s+ALERTS?',
  'HISTORY', 'ALLERGIES', 'MEDICATIONS', 'EMERGENCY',
  'QR\\s+CODES?',
]

const BOUNDARY_LOOKAHEAD = `(?=\\s+(?:${ROW_LABEL_BOUNDARIES.join('|')})\\b|$)`

function parsePatientHeader(text) {
  const out = {}

  // Name: from "Name:" or "Name" to a "|" or DOB keyword
  const nameM = text.match(/Name\s*[:\-]?\s*(.+?)(?=\s*\|\s*|\s+(?:Date\s+of\s+Birth|DOB|D\.O\.B\.?)\b|$)/i)
  if (nameM) out.fullName = nameM[1].trim()

  // DOB
  const dobM = text.match(/(?:Date\s+of\s+Birth|DOB|D\.O\.B\.?)\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})/i)
  if (dobM) out.dob = normalizeDate(dobM[1])

  // Address — capture until next known label or end
  const addrM = text.match(new RegExp(`Address\\s*[:\\-]?\\s*(.+?)${BOUNDARY_LOOKAHEAD}`, 'i'))
  if (addrM) out.address = addrM[1].trim()

  // Phone (optional)
  const phoneM = text.match(new RegExp(`Phone(?:\\(s\\)|s|\\s+Number)?\\s*[:\\-]?\\s*(.+?)${BOUNDARY_LOOKAHEAD}`, 'i'))
  if (phoneM) out.phone = phoneM[1].trim()

  // Email (optional)
  const emailM = text.match(/Email\s*[:\-]?\s*([^\s,;]+@[^\s,;]+)/i)
  if (emailM) out.email = emailM[1].trim()

  return out
}

function parseCriticalSection(text) {
  const out = {}

  const dnrM = text.match(/DNR(?:\s+Status)?\s*[:\-]?\s*(YES|NO|Y|N|Unknown)\b/i)
  if (dnrM) out.dnr = normalizeYN(dnrM[1])

  // NB: don't use \b after the value — "+" and "-" aren't word characters,
  // so \b fails to match against trailing whitespace. Use a positive lookahead.
  const bloodM = text.match(/Blood\s+Type\s*[:\-]?\s*(AB\s*[+-]|A\s*[+-]|B\s*[+-]|O\s*[+-]|Unknown)(?=\s|$|[.,;])/i)
  if (bloodM) out.bloodType = normalizeBlood(bloodM[1])

  const hospitalM = text.match(new RegExp(`Preferred\\s+Hospital\\s*[:\\-]?\\s*(.+?)${BOUNDARY_LOOKAHEAD}`, 'i'))
  if (hospitalM) out.preferredHospital = hospitalM[1].trim()

  const pcpM = text.match(new RegExp(`(?:Primary\\s+Care\\s*(?:Physician)?|PCP)\\s*[:\\-]?\\s*(.+?)${BOUNDARY_LOOKAHEAD}`, 'i'))
  if (pcpM) out.pcp = pcpM[1].trim()

  // Blood Thinners — our form doesn't have this field. Preserve the info
  // by surfacing it for the caller to fold into additionalInfo.
  const thinM = text.match(/Blood\s+Thinners\??\s*[:\-]?\s*(YES|NO|Y|N|Unknown)\b/i)
  if (thinM) out._bloodThinners = normalizeYN(thinM[1])

  return out
}

function parseContactsSection(text) {
  // The contacts section contains two row labels: "Contacts" and "Additional Info".
  const result = {}

  // Find Additional Info first so we know where contacts ends.
  const addtlIdxRe = /Additional\s+(?:Info(?:rmation)?|Notes?)\s*[:\-]?\s*/i
  const addtlMatch = addtlIdxRe.exec(text)

  let contactsRegion
  let additionalRegion = ''
  if (addtlMatch) {
    contactsRegion = text.slice(0, addtlMatch.index)
    additionalRegion = text.slice(addtlMatch.index + addtlMatch[0].length)
  } else {
    contactsRegion = text
  }

  result.emergencyContacts = stripLeadingLabel(contactsRegion, [
    'Emergency Contacts',
    'Contacts',
  ])
  if (additionalRegion) {
    result.additionalInfo = additionalRegion.trim()
  }
  return result
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------

const CRITICAL_HEADS = ['CRITICAL ALERTS', 'CRITICAL ALERT', 'CRITICAL']
const HISTORY_HEADS = ['MEDICAL HISTORY', 'HISTORY', 'Past/Current Conditions']
const ALLERGY_HEADS = ['ALLERGIES']
const MED_HEADS = ['CURRENT MEDICATIONS', 'MEDICATIONS']
const CONTACT_HEADS = [
  'EMERGENCY CONTACTS & NOTES',
  'EMERGENCY CONTACTS AND NOTES',
  'EMERGENCY CONTACTS',
  'CONTACTS & NOTES',
]
const END_HEADS = ['QR CODES', 'QR CODE', '--- QR', '— QR', 'SCAN FOR OFFLINE']

export function parseHamPdfText(rawText) {
  const text = normalizeText(rawText)
  const data = {}

  // 1. Patient header — everything before the first section header.
  const firstSectionRe = anchorRegex([
    ...CRITICAL_HEADS, ...HISTORY_HEADS, ...ALLERGY_HEADS, ...MED_HEADS, ...CONTACT_HEADS,
  ])
  const firstSectionM = firstSectionRe.exec(text)
  const headerText = firstSectionM ? text.slice(0, firstSectionM.index) : text
  Object.assign(data, parsePatientHeader(headerText))

  // 2. Critical Alerts
  const critical = sectionContent(text, CRITICAL_HEADS, [
    ...HISTORY_HEADS, ...ALLERGY_HEADS, ...MED_HEADS, ...CONTACT_HEADS, ...END_HEADS,
  ])
  if (critical) {
    const cr = parseCriticalSection(critical)
    Object.assign(data, cr)
    if (cr._bloodThinners) {
      // Stash for folding into additionalInfo after the contacts section is parsed.
      data.__bloodThinners = cr._bloodThinners
      delete data._bloodThinners
    }
  }

  // 3. History
  const history = sectionContent(text, HISTORY_HEADS, [
    ...ALLERGY_HEADS, ...MED_HEADS, ...CONTACT_HEADS, ...END_HEADS,
  ])
  if (history) {
    data.history = stripLeadingLabel(history, [
      'Past/Current Conditions',
      'Conditions',
      'Medical History',
      'History',
    ])
  }

  // 4. Allergies
  const allergies = sectionContent(text, ALLERGY_HEADS, [
    ...MED_HEADS, ...CONTACT_HEADS, ...END_HEADS,
  ])
  if (allergies) {
    data.allergies = stripLeadingLabel(allergies, ['Allergies'])
  }

  // 5. Medications
  const meds = sectionContent(text, MED_HEADS, [
    ...CONTACT_HEADS, ...END_HEADS,
  ])
  if (meds) {
    data.medications = stripLeadingLabel(meds, [
      'Medications & Dosages',
      'Medications and Dosages',
      'Current Medications',
      'Medications',
    ])
  }

  // 6. Contacts + Additional Info
  const contacts = sectionContent(text, CONTACT_HEADS, END_HEADS)
  if (contacts) {
    const parsed = parseContactsSection(contacts)
    if (parsed.emergencyContacts) data.emergencyContacts = parsed.emergencyContacts
    if (parsed.additionalInfo) data.additionalInfo = parsed.additionalInfo
  }

  // Fold blood-thinners into additionalInfo so the info isn't lost.
  if (data.__bloodThinners) {
    const prefix = `Blood Thinners: ${data.__bloodThinners}`
    data.additionalInfo = data.additionalInfo
      ? `${prefix}\n${data.additionalInfo}`
      : prefix
    delete data.__bloodThinners
  }

  // Trim trailing separator junk on long-form fields only — e.g. "—— QR CODES"
  // tails can leak onto the last field. We require RUNS of 2+ separators so
  // we never clobber legitimate trailing characters (e.g. blood type "B-").
  const TRIM_TAILS_ON = [
    'address', 'preferredHospital', 'pcp',
    'history', 'allergies', 'medications',
    'emergencyContacts', 'additionalInfo',
  ]
  const tailRunRe = /\s*[-—–=*·•]{2,}\s*$/g
  const headRunRe = /^\s*[-—–=*·•]{2,}\s*/g
  for (const k of TRIM_TAILS_ON) {
    if (typeof data[k] === 'string') {
      data[k] = data[k].replace(tailRunRe, '').replace(headRunRe, '').trim()
    }
  }

  // Strip empties so we don't overwrite existing form values with blanks.
  for (const k of Object.keys(data)) {
    if (data[k] == null || (typeof data[k] === 'string' && data[k].trim() === '')) {
      delete data[k]
    }
  }
  return data
}
