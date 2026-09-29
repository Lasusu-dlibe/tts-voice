import { useCallback, useEffect, useRef, useState } from 'react'
import { speak } from '../services/ttsService'
import type { PlaybackState, ReaderSettings } from '../types/reader'

interface ReaderOptions { units: string[]; text: string; settings: ReaderSettings; voice?: SpeechSynthesisVoice }
export function useReader({ units, text, settings, voice }: ReaderOptions) {
  const [state, setState] = useState<PlaybackState>('idle')
  const [index, setIndex] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const token = useRef(0)
  const timer = useRef<number | undefined>()
  const timerStarted = useRef(0)
  const remaining = useRef(0)
  const repeat = useRef(0)
  const latest = useRef({ units, text, settings, voice })
  latest.current = { units, text, settings, voice }

  const clearTimer = useCallback(() => { if (timer.current) window.clearInterval(timer.current); timer.current = undefined }, [])
  const cancel = useCallback(() => {
    token.current += 1; clearTimer(); remaining.current = 0; setCountdown(0)
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    return token.current
  }, [clearTimer])

  const playUnit = useCallback((at: number, run: number) => {
    const { units: currentUnits, settings: currentSettings, voice: currentVoice } = latest.current
    if (run !== token.current) return
    const unit = currentUnits[at]
    if (!unit) { setState('finished'); setCountdown(0); return }
    setIndex(at); setState('reading'); setCountdown(0)
    try {
      speak(unit, currentSettings, currentVoice, {
        onEnd: () => {
          if (run !== token.current) return
          if (currentSettings.mode === 'teacher' && repeat.current + 1 < currentSettings.repeatCount) {
            repeat.current += 1
            beginWait(currentSettings.repeatPauseSeconds, run, () => playUnit(at, run))
          } else if (currentSettings.mode === 'teacher' && at < currentUnits.length - 1) {
            repeat.current = 0
            beginWait(currentSettings.pauseSeconds, run, () => playUnit(at + 1, run))
          } else if (currentSettings.mode === 'normal') setState('finished')
          else { repeat.current = 0; setState('finished') }
        },
        onError: (event) => {
          if (run !== token.current || event.error === 'canceled' || event.error === 'interrupted') return
          setError('Không thể phát giọng đọc. Hãy thử chọn giọng khác hoặc kiểm tra trình duyệt.')
          setState('stopped')
        },
      })
    } catch { setError('Trình duyệt không thể phát giọng đọc này.'); setState('stopped') }
  }, [])

  const beginWait = useCallback((seconds: number, run: number, done: () => void, durationMs?: number) => {
    if (run !== token.current) return
    const total = durationMs ?? seconds * 1000
    remaining.current = total; timerStarted.current = Date.now(); setState('waiting'); setCountdown(Math.ceil(total / 1000))
    clearTimer()
    timer.current = window.setInterval(() => {
      if (run !== token.current) { clearTimer(); return }
      const left = Math.max(0, remaining.current - (Date.now() - timerStarted.current))
      setCountdown(Math.ceil(left / 1000))
      if (left <= 0) { clearTimer(); remaining.current = 0; done() }
    }, 150)
  }, [clearTimer])

  const start = useCallback((at = 0) => {
    const run = cancel(); setError(''); repeat.current = 0
    if (!latest.current.units.length || !latest.current.text.trim()) { setState('idle'); return }
    const startIndex = Math.max(0, Math.min(at, latest.current.units.length - 1))
    if (latest.current.settings.mode === 'normal') {
      setIndex(0); setState('reading')
      const { text: fullText, settings: currentSettings, voice: currentVoice } = latest.current
      speak(fullText, currentSettings, currentVoice, { onEnd: () => { if (run === token.current) setState('finished') }, onError: (e) => { if (run === token.current && e.error !== 'canceled' && e.error !== 'interrupted') setError('Không thể phát giọng đọc.') } })
    } else playUnit(startIndex, run)
  }, [cancel, playUnit])

  const stop = useCallback(() => { cancel(); setState('stopped') }, [cancel])
  const pause = useCallback(() => {
    if (state === 'waiting') {
      remaining.current = Math.max(0, remaining.current - (Date.now() - timerStarted.current)); clearTimer(); setState('paused')
    } else if (state === 'reading' && 'speechSynthesis' in window) { window.speechSynthesis.pause(); setState('paused') }
  }, [state, clearTimer])
  const resume = useCallback(() => {
    if (state !== 'paused') return
    if (remaining.current > 0) {
      const run = token.current
      // A pause interval between repeats returns to the same unit; a copy interval advances.
      const target = repeat.current > 0 ? index : index + 1
      beginWait(Math.ceil(remaining.current / 1000), run, () => playUnit(target, run), remaining.current)
    } else if ('speechSynthesis' in window) { window.speechSynthesis.resume(); setState('reading') }
  }, [state, index, playUnit, beginWait])
  const move = useCallback((delta: number) => {
    const count = latest.current.units.length
    if (!count) return
    const target = Math.max(0, Math.min(count - 1, index + delta))
    start(target)
  }, [index, start])
  const replay = useCallback(() => { if (latest.current.units.length) start(index) }, [index, start])

  useEffect(() => () => { token.current += 1; clearTimer(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [clearTimer])
  return { state, index, countdown, error, start, stop, pause, resume, move, replay }
}
