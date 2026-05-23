/**
 * Client-side extraction of HAM-sheet content from a user-uploaded file.
 *
 * PDF strategy (in priority order):
 *   1. Read PDF metadata. Our own generated PDFs embed the full structured
 *      form data as base64-encoded JSON in the Keywords field — instant
 *      perfect round-trip, no parsing required.
 *   2. Extract page text with pdfjs-dist and run the section-anchored
 *      parser (parseHamPdfText). Works on any HAM-style sheet whose
 *      section headers we recognize.
 *
 * Image strategy: try jsQR for a vCard QR. We don't OCR images at the
 * moment — reading typewritten text from a photo would require a ~10MB
 * OCR model and the quality is uneven. PDF is the recommended format
 * for round-trip editing.
 *
 * Everything happens in-browser. No bytes leave the device.
 */

import { parseVCard } from './parseVCard.js'
import { parseHamPdfText } from './parseHamPdf.js'
import { HAM_META_PREFIX, decodePayload } from './pdf.js'

const MAX_QR_CANVAS_SIDE = 2200 // keep memory in check on mobile

async function loadImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Could not load image'))
      i.src = url
    })
    return img
  } finally {
    // Revoke after the next tick so the decoded image isn't lost.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

function drawToCanvas(source, maxSide = MAX_QR_CANVAS_SIDE) {
  const w0 = source.naturalWidth || source.width
  const h0 = source.naturalHeight || source.height
  const scale = Math.min(1, maxSide / Math.max(w0, h0))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w0 * scale)
  canvas.height = Math.round(h0 * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

async function scanCanvasForQr(canvas, ctx) {
  const { default: jsQR } = await import('jsqr')
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(data.data, data.width, data.height, {
    inversionAttempts: 'attemptBoth',
  })
  return code?.data || null
}

async function loadPdfJs() {
  // Lazy: only paid for when the user actually uploads a PDF.
  const pdfjsLib = await import('pdfjs-dist')
  // Vite bundles the worker file as a hashed asset; `?url` returns its URL.
  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default
  return pdfjsLib
}

async function extractFromImageFile(file) {
  const img = await loadImage(file)
  const { canvas, ctx } = drawToCanvas(img)
  const qr = await scanCanvasForQr(canvas, ctx)
  if (qr) return { kind: 'qr', text: qr }
  return { kind: 'none' }
}

async function extractFromPdfFile(file, onProgress) {
  const pdfjsLib = await loadPdfJs()
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const pageCount = pdf.numPages

  // 1) Try embedded metadata first — instant perfect round-trip for our own sheets.
  onProgress?.('Looking for embedded data…')
  try {
    const meta = await pdf.getMetadata()
    const keywords = meta?.info?.Keywords || ''
    if (typeof keywords === 'string' && keywords.includes(HAM_META_PREFIX)) {
      const idx = keywords.indexOf(HAM_META_PREFIX) + HAM_META_PREFIX.length
      // Payload runs to the next comma or end of string (we write it as
      // a comma-separated keywords list).
      const tail = keywords.slice(idx)
      const payload = tail.split(',', 1)[0].trim()
      const data = decodePayload(payload)
      if (data && typeof data === 'object') {
        return { kind: 'metadata', data }
      }
    }
  } catch {
    // metadata read failed — fall through to text extraction
  }

  // 2) Fall back to text extraction + flexible parsing.
  onProgress?.(pageCount === 1 ? 'Reading your sheet…' : `Reading ${pageCount} pages…`)
  let allText = ''
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    for (const it of tc.items) {
      if (it.hasEOL) allText += '\n'
      allText += it.str + ' '
    }
    allText += '\n'
  }
  return { kind: 'text', text: allText }
}

/**
 * Extract structured form data from an uploaded file.
 *
 * Returns one of:
 *   { ok: true,  data, fieldsFound, source: 'qr' | 'text' }
 *   { ok: false, reason: string }
 */
export async function extractFormDataFromFile(file, onProgress) {
  if (!file) return { ok: false, reason: 'No file selected.' }

  const isImage = file.type.startsWith('image/')
  const isPdf =
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')

  if (!isImage && !isPdf) {
    return {
      ok: false,
      reason: 'Unsupported file type. Please upload a JPG, PNG, or PDF.',
    }
  }

  onProgress?.('Reading your file…')
  let result
  try {
    result = isPdf
      ? await extractFromPdfFile(file, onProgress)
      : await extractFromImageFile(file)
  } catch (err) {
    console.error(err)
    return {
      ok: false,
      reason:
        'We couldn’t read that file. If it’s a photo, try a sharper, well-lit image.',
    }
  }

  if (result.kind === 'metadata') {
    // Round-tripped from our own sheet's embedded payload.
    const fieldCount = Object.values(result.data).filter(
      (v) => v != null && (typeof v !== 'string' || v.trim() !== '') && v !== false,
    ).length
    return {
      ok: true,
      data: result.data,
      fieldsFound: fieldCount,
      source: 'metadata',
    }
  }

  if (result.kind === 'qr') {
    const parsed = parseVCard(result.text)
    if (parsed && Object.keys(parsed).length) {
      return {
        ok: true,
        data: parsed,
        fieldsFound: Object.keys(parsed).length,
        source: 'qr',
      }
    }
    return {
      ok: false,
      reason:
        'We found a QR code but couldn’t read HAM data from it. Please fill the form in manually.',
    }
  }

  if (result.kind === 'text') {
    const parsed = parseHamPdfText(result.text)
    if (parsed && Object.keys(parsed).length >= 2) {
      return {
        ok: true,
        data: parsed,
        fieldsFound: Object.keys(parsed).length,
        source: 'text',
      }
    }
    return {
      ok: false,
      reason:
        'We read your PDF but couldn’t recognize HAM fields in it. If this is a scanned image, please re-upload the original PDF. Otherwise, fill the form in manually.',
    }
  }

  return {
    ok: false,
    reason:
      'We couldn’t read anything useful from this file. Please fill the form in manually.',
  }
}
