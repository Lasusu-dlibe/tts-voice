import type { ReaderSettings } from '../types/reader'

export const OFFLINE_VIETNAMESE_VOICE = 'offline:vi-vais1000-medium'

type PlaybackCallbacks = {
  onEnd: () => void
  onError: (error: unknown) => void
  onLoading: (loading: boolean) => void
}

export interface OfflinePlayback {
  pause: () => void
  resume: () => void
  cancel: () => void
}

type Runtime = {
  generate: (text: string) => Promise<{ file: Blob }>
  destroy: () => void
}

let runtimePromise: Promise<Runtime> | undefined

async function loadPiperModule(): Promise<typeof import('piper-tts-web')> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Trình duyệt không hỗ trợ tải bộ đọc nén. Hãy cập nhật Chrome hoặc Edge.')
  }

  const response = await fetch(new URL('vendor/piper-tts-web.gzbin', document.baseURI))
  if (!response.ok || !response.body) throw new Error('Không tải được bộ đọc tiếng Việt.')

  const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'))
  const bytes = await new Response(decompressed).arrayBuffer()
  const bundle = new Blob([bytes], { type: 'text/javascript' })
  const moduleUrl = URL.createObjectURL(bundle)
  try {
    return await import(/* @vite-ignore */ moduleUrl) as typeof import('piper-tts-web')
  } finally {
    URL.revokeObjectURL(moduleUrl)
  }
}

async function getRuntime(): Promise<Runtime> {
  if (!runtimePromise) {
    runtimePromise = loadPiperModule().then(async (piper) => {
      const base = (path: string) => new URL(path, document.baseURI).href
      const provider = new piper.HuggingFaceVoiceProvider()
      const phonemizer = new piper.PhonemizeWebRuntime({ basePath: base('piper/') })
      const runtimeOptions = { basePath: base('onnx/'), numThreads: 1 }
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
      const hasGpuAdapter = Boolean(gpu && await gpu.requestAdapter())
      const onnx = hasGpuAdapter
        ? new piper.OnnxWebGPURuntime(runtimeOptions)
        : new piper.OnnxWebRuntime(runtimeOptions)
      const engine = new piper.PiperWebEngine({ voiceProvider: provider, phonemizeRuntime: phonemizer, onnxRuntime: onnx })
      const voiceId = 'vi_VN-vais1000-medium'

      return {
        generate: (text: string) => engine.generate(text, voiceId, 0),
        destroy: () => engine.destroy(),
      }
    }).catch((error) => {
      runtimePromise = undefined
      throw error
    })
  }
  return runtimePromise
}

export function speakOfflineVietnamese(
  text: string,
  settings: ReaderSettings,
  callbacks: PlaybackCallbacks,
  isCurrent: () => boolean,
): OfflinePlayback {
  let canceled = false
  let paused = false
  let buffer: AudioBuffer | undefined
  let source: AudioBufferSourceNode | undefined
  let gain: GainNode | undefined
  let context: AudioContext | undefined
  let offset = 0
  let startedAt = 0

  // Create/resume synchronously from the user's click so generated audio can
  // play after the model finishes loading without being blocked as autoplay.
  try {
    context = new AudioContext()
    void context.resume()
  } catch (error) {
    callbacks.onError(error)
  }

  const stopSource = () => {
    if (!source) return
    source.onended = null
    try { source.stop() } catch { /* already stopped */ }
    source.disconnect()
    source = undefined
  }

  const startSource = () => {
    if (!context || !buffer || canceled || paused || !isCurrent()) return
    source = context.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = settings.rate
    gain = context.createGain()
    gain.gain.value = settings.volume
    source.connect(gain)
    gain.connect(context.destination)
    startedAt = context.currentTime
    source.onended = () => {
      if (canceled || paused || !isCurrent()) return
      offset = buffer?.duration ?? 0
      callbacks.onEnd()
      void context?.close()
      context = undefined
    }
    source.start(0, offset)
  }

  callbacks.onLoading(true)
  void (async () => {
    try {
      if (!context) throw new Error('Trình duyệt không hỗ trợ phát âm thanh ngoại tuyến.')
      const runtime = await getRuntime()
      if (canceled || !isCurrent()) return
      const result = await runtime.generate(text)
      if (canceled || !isCurrent() || !context) return
      buffer = await context.decodeAudioData(await result.file.arrayBuffer())
      callbacks.onLoading(false)
      startSource()
    } catch (error) {
      callbacks.onLoading(false)
      if (!canceled && isCurrent()) callbacks.onError(error)
      void context?.close()
      context = undefined
    }
  })()

  return {
    pause: () => {
      if (canceled || paused) return
      paused = true
      if (source && context) {
        offset = Math.min(buffer?.duration ?? 0, offset + (context.currentTime - startedAt) * settings.rate)
        stopSource()
      }
      void context?.suspend()
    },
    resume: () => {
      if (canceled || !paused) return
      paused = false
      void context?.resume().then(startSource)
      startSource()
    },
    cancel: () => {
      if (canceled) return
      canceled = true
      stopSource()
      void context?.close()
      context = undefined
    },
  }
}
