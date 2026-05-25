/**
 * Client-side PDF generation. html2pdf.js wraps html2canvas + jsPDF.
 *
 * We capture the off-screen .ham-sheet node at its native 8.5"x11" size,
 * then ask jsPDF to lay it out on letter paper. scale: 2 keeps text crisp
 * and — critically — keeps the QR code scannable.
 *
 * IMPORTANT: html2canvas rasterizes the page (it becomes a JPEG embedded in
 * the PDF). That makes the PDF visually pixel-perfect but means the text
 * isn't selectable / extractable. To still support clean round-trip editing
 * of our own sheets, we embed the structured form data in the PDF's
 * Keywords metadata field — invisible to humans but trivial to recover
 * with pdfjs-dist's getMetadata().
 */

// Signature must match what extract.js looks for.
export const HAM_META_PREFIX = 'HAM_SHEET_DATA_V1:'

/** Encode a JS object as UTF-8-safe base64 (works for emoji and other non-ASCII). */
function encodePayload(obj) {
  const json = JSON.stringify(obj)
  // btoa requires Latin-1; round-trip through UTF-8 first.
  return btoa(unescape(encodeURIComponent(json)))
}

/** Inverse of encodePayload, for the import path. */
export function decodePayload(b64) {
  try {
    const json = decodeURIComponent(escape(atob(b64)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function downloadPdf(node, filename = 'ham-sheet.pdf', formData = null) {
  if (!node) throw new Error('downloadPdf: no node provided')
  const { default: html2pdf } = await import('html2pdf.js')

  const opts = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Do not override windowWidth/windowHeight — letting html2canvas measure
      // the node naturally prevents the blank-first-page artifact that occurs
      // when the captured dimensions don't align with jsPDF's letter layout.
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait',
      compress: true,
    },
    // 'avoid-all' can push the entire content off page 1, producing a blank
    // first page. The sheet is single-page by design so no mode is needed.
    pagebreak: { mode: 'css' },
  }

  // Chain through html2pdf so we get access to the jsPDF instance before save.
  // This lets us write the structured-data payload into PDF metadata.
  const worker = html2pdf().set(opts).from(node).toPdf()
  const pdf = await worker.get('pdf')

  if (formData) {
    const payload = encodePayload(formData)
    const title = formData.fullName
      ? `${formData.fullName} — Emergency Medical Info (HAM)`
      : 'Emergency Medical Info (HAM)'
    pdf.setProperties({
      title,
      subject: 'HAM Sheet (History · Allergies · Medications)',
      author: 'HAM Sheet Generator',
      creator: 'HAM Sheet Generator',
      // Keywords is a free-form string in the PDF Info dict — perfect home
      // for our encoded payload. Any standard PDF reader preserves it.
      keywords: `HAM,emergency,medical,${HAM_META_PREFIX}${payload}`,
    })
  }

  pdf.save(filename)
}

/**
 * Suggest a filename like "Jane-Doe-HAM-2026-05-18.pdf".
 */
export function suggestFilename(fullName) {
  const today = new Date().toISOString().slice(0, 10)
  const slug = (fullName || 'ham-sheet')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9-]/g, '')
    .slice(0, 40) || 'ham-sheet'
  return `${slug}-HAM-${today}.pdf`
}
