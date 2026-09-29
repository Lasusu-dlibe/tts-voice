import type { ReaderSettings, SpeechVoice } from '../types/reader'
export function isSpeechSupported(): boolean { return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window }
export function getVoices(): SpeechVoice[] {
  if (!isSpeechSupported()) return []
  return window.speechSynthesis.getVoices().map((voice) => ({ voice, label: `${voice.name} (${voice.lang})${voice.default ? ' · Mặc định' : ''}` }))
    .sort((a, b) => Number(!/^vi(-|$)/i.test(a.voice.lang)) - Number(!/^vi(-|$)/i.test(b.voice.lang)) || a.label.localeCompare(b.label, 'vi'))
}
export function speak(text: string, settings: ReaderSettings, voice: SpeechSynthesisVoice | undefined, handlers: { onEnd: () => void; onError: (error: SpeechSynthesisErrorEvent) => void }): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = voice?.lang || 'vi-VN'; if (voice) utterance.voice = voice
  utterance.rate = settings.rate; utterance.pitch = settings.pitch; utterance.volume = settings.volume
  utterance.onend = handlers.onEnd; utterance.onerror = handlers.onError; window.speechSynthesis.speak(utterance); return utterance
}
