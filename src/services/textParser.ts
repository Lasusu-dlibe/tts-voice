import type { SplitMode } from '../types/reader'
const ABBREVIATIONS = new Set(['vd', 'ts', 'ths', 'pgs', 'gs', 'tp', 'q', 'p', 'st', 'tr', 'kg', 'cm', 'mm', 'km', 'th'])
function splitParagraph(paragraph: string, includeCommas: boolean): string[] {
  const result: string[] = []; let start = 0
  for (let i = 0; i < paragraph.length; i += 1) {
    const char = paragraph[i]
    if (char === '.' && /\d/.test(paragraph[i - 1] ?? '') && /\d/.test(paragraph[i + 1] ?? '')) continue
    const isEnd = '.!?…'.includes(char) || (includeCommas && ',;:'.includes(char))
    if (!isEnd) continue
    if (char === '.') {
      const prev = paragraph.slice(start, i).trim().split(/\s+/).pop()?.replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase('vi') ?? ''
      if (ABBREVIATIONS.has(prev)) continue
    }
    let end = i + 1; while (end < paragraph.length && '.!?…'.includes(paragraph[end])) end += 1
    const part = paragraph.slice(start, end).trim(); if (part) result.push(part)
    start = end; i = end - 1
  }
  const tail = paragraph.slice(start).trim(); if (tail) result.push(tail)
  return result
}
function splitLongByWords(units: string[], target: number): string[] {
  const output: string[] = []
  for (const unit of units) {
    const words = unit.split(/\s+/).filter(Boolean); let offset = 0
    while (words.length - offset > target) {
      const preferred = Math.min(offset + target, words.length); const lower = Math.max(offset + 1, preferred - 3); const upper = Math.min(words.length - 1, preferred + 3)
      let boundary = preferred; let best = Number.POSITIVE_INFINITY
      for (let candidate = lower; candidate <= upper; candidate += 1) {
        const punct = /[,;:]$/.test(words.slice(offset, candidate).join(' ')); const score = Math.abs(candidate - preferred) - (punct ? 1.5 : 0)
        if (score < best) { best = score; boundary = candidate }
      }
      output.push(words.slice(offset, boundary).join(' ')); offset = boundary
    }
    const tail = words.slice(offset).join(' '); if (tail) output.push(tail)
  }
  return output
}
export function parseReadingUnits(text: string, mode: SplitMode, chunkSize: number): string[] {
  return text.split(/\n\s*\n/).flatMap((p) => {
    const normalized = p.replace(/\s*\n\s*/g, ' ').trim(); if (!normalized) return []
    const units = splitParagraph(normalized, mode === 'punctuation')
    return mode === 'words' ? splitLongByWords(units, chunkSize) : units
  }).filter(Boolean)
}
export function wordCount(text: string): number { return text.trim() ? text.trim().split(/\s+/u).length : 0 }
