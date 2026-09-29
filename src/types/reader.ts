export type ReaderMode = 'normal' | 'teacher'
export type SplitMode = 'sentence' | 'punctuation' | 'words'
export type PlaybackState = 'idle' | 'reading' | 'paused' | 'waiting' | 'stopped' | 'finished'
export interface ReaderSettings {
  mode: ReaderMode; splitMode: SplitMode; rate: number; pitch: number; volume: number; voiceURI: string
  pauseSeconds: number; repeatCount: number; repeatPauseSeconds: number; chunkSize: number; rememberText: boolean
}
export interface SpeechVoice { voice: SpeechSynthesisVoice; label: string }
export const DEFAULT_SETTINGS: ReaderSettings = { mode: 'teacher', splitMode: 'sentence', rate: 0.8, pitch: 1, volume: 1, voiceURI: '', pauseSeconds: 5, repeatCount: 1, repeatPauseSeconds: 2, chunkSize: 8, rememberText: false }
