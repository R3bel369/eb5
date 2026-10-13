import * as pdfjsLib from 'pdfjs-dist'
import type { KnowledgeBaseItem } from './knowledgeBase'

// Configure worker to avoid cross-origin or bundling worker crashes
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`
}

/**
 * Extracts plain text content from a PDF ArrayBuffer
 */
export async function extractTextFromPdf(data: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      useWorkerFetch: false,
      useSystemFonts: true,
    })

    const pdfDoc = await loadingTask.promise
    const textPieces: string[] = []

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ')

      if (pageText.trim()) {
        textPieces.push(pageText.trim())
      }
    }

    const fullText = textPieces.join('\n\n')
    if (fullText.trim()) {
      return fullText
    }
  } catch (err) {
    console.warn('PDF.js standard parse failed, falling back to raw stream scanner:', err)
  }

  // Fallback scanner for standard text streams in PDF binary
  return extractRawPdfTextFallback(data)
}

/**
 * Lightweight binary stream fallback to extract printable text tokens if PDF.js worker fails
 */
function extractRawPdfTextFallback(data: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(data)
    let binaryStr = ''
    // sample readable chunks
    const maxBytes = Math.min(uint8.length, 1024 * 1024 * 4) // up to 4MB
    for (let i = 0; i < maxBytes; i++) {
      const byte = uint8[i]
      if (byte >= 32 && byte <= 126) {
        binaryStr += String.fromCharCode(byte)
      } else if (byte === 10 || byte === 13) {
        binaryStr += '\n'
      }
    }

    // Match text within parentheses (e.g. (Some text) Tj)
    const matches = binaryStr.match(/\(([^()]{3,})\)\s*(?:Tj|TJ|\')/g) || []
    const extracted = matches
      .map(m => m.replace(/^[(\s]+|[)\sTjTJ']+$/g, '').trim())
      .filter(m => m.length > 3 && !m.startsWith('/'))
      .join(' ')

    return extracted
  } catch (err) {
    console.error('Raw PDF fallback failed:', err)
    return ''
  }
}

/**
 * Parses raw text extracted from a PDF document into structured Knowledge Base items
 */
export function parsePdfTextToKnowledgeItems(
  rawText: string,
  fileName: string = 'Document'
): Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> {
  if (!rawText || rawText.trim().length === 0) return []

  const results: Array<Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>> = []

  // 1. Try Q&A block detection (e.g. "Q: ... A: ..." or "Question ... Answer ...")
  const qaPattern = /(?:^|\n)(?:Q(?:uestion)?[:\s\d.-]+)([^\n?]+[?])\s*(?:A(?:nswer)?[:\s-]+)?([\s\S]*?)(?=(?:\nQ(?:uestion)?[:\s\d.-]+)|$)/gi
  let match: RegExpExecArray | null

  while ((match = qaPattern.exec(rawText)) !== null) {
    const question = match[1]?.trim()
    const answer = match[2]?.trim()

    if (question && answer && question.length >= 5 && answer.length >= 10) {
      results.push({
        question,
        answer: cleanAnswerText(answer),
        category: inferCategory(question + ' ' + answer),
        tags: extractKeywords(question + ' ' + answer),
        isActive: true,
      })
    }
  }

  // 2. If Q&A pattern found items, return them
  if (results.length > 0) {
    return results
  }

  // 3. Try numbered sections or bullet points (e.g., "1. What is...", "Section 1:...")
  const numberedPattern = /(?:^|\n)(?:\d+[.)]\s+|\bSection\s+\d+[:\s]+)([^\n]+)\n+([\s\S]*?)(?=(?:\n\d+[.)]\s+|\bSection\s+\d+[:\s]+)|$)/gi
  while ((match = numberedPattern.exec(rawText)) !== null) {
    const title = match[1]?.trim()
    const content = match[2]?.trim()

    if (title && content && title.length >= 5 && content.length >= 20) {
      // Turn title into a natural question if not already
      const question = title.endsWith('?') ? title : `What are the details regarding ${title}?`
      results.push({
        question,
        answer: cleanAnswerText(content),
        category: inferCategory(title + ' ' + content),
        tags: extractKeywords(title + ' ' + content),
        isActive: true,
      })
    }
  }

  if (results.length > 0) {
    return results
  }

  // 4. Fallback: Split document into coherent thematic paragraphs (chunks of ~300-600 characters)
  const paragraphs = rawText
    .split(/\n{2,}|\.\s+(?=[A-Z])/)
    .map(p => p.trim())
    .filter(p => p.length >= 60)

  const docBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

  let chunkIndex = 1
  for (let i = 0; i < paragraphs.length; i += 2) {
    const combined = paragraphs.slice(i, i + 2).join(' ')
    if (combined.length >= 80) {
      // Extract the first sentence as the question hook
      const firstSentence = combined.split('.')[0] + '?'
      const question = firstSentence.length <= 80
        ? firstSentence
        : `What does ${docBaseName} state regarding section ${chunkIndex}?`

      results.push({
        question,
        answer: cleanAnswerText(combined),
        category: inferCategory(combined),
        tags: extractKeywords(combined),
        isActive: true,
      })
      chunkIndex++
    }
  }

  return results
}

function cleanAnswerText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/Page \d+ of \d+/gi, '')
    .trim()
    .slice(0, 1500) // Cap to readable answer length
}

function inferCategory(text: string): any {
  const lower = text.toLowerCase()
  if (lower.includes('invest') || lower.includes('800,000') || lower.includes('tea') || lower.includes('capital') || lower.includes('funds')) {
    return 'Investment Capital'
  }
  if (lower.includes('job') || lower.includes('worker') || lower.includes('employment') || lower.includes('full-time') || lower.includes('10 jobs')) {
    return 'Job Creation'
  }
  if (lower.includes('timeline') || lower.includes('i-526') || lower.includes('i-829') || lower.includes('uscis') || lower.includes('processing') || lower.includes('priority')) {
    return 'Process & Timeline'
  }
  if (lower.includes('regional center') || lower.includes('direct investment') || lower.includes('exemplar')) {
    return 'Regional Centers'
  }
  if (lower.includes('family') || lower.includes('spouse') || lower.includes('children') || lower.includes('age') || lower.includes('cpa') || lower.includes('derivative')) {
    return 'Family Eligibility'
  }
  return 'General EB-5'
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const candidates = [
    'eb-5', 'ria 2022', 'minimum investment', '$800k', '$1,050,000', 'targeted employment area',
    'tea', 'rural', 'high unemployment', 'infrastructure', 'uscis', 'form i-526e', 'form i-829',
    'form i-485', 'concurrent filing', 'green card', 'conditional residency', 'job creation',
    'regional center', 'direct investment', 'source of funds', 'lawful source', 'capital at risk',
    'family', 'spouse', 'children under 21', 'ead', 'advance parole'
  ]

  const matched = candidates.filter(term => lower.includes(term.toLowerCase()))
  return matched.slice(0, 5)
}
