declare module 'piper-tts-web' {
  export class OnnxWebRuntime {
    constructor(options?: { basePath?: string; numThreads?: number })
    destroy(): void
  }
  export class OnnxWebGPURuntime extends OnnxWebRuntime {}
  export class PhonemizeWebRuntime {
    constructor(options?: { basePath?: string })
    destroy(): void
  }
  export class HuggingFaceVoiceProvider {
    constructor(options?: { baseUrl?: string })
    destroy(): void
  }
  export class PiperWebEngine {
    constructor(options?: { onnxRuntime?: OnnxWebRuntime; phonemizeRuntime?: PhonemizeWebRuntime; voiceProvider?: HuggingFaceVoiceProvider })
    generate(text: string, voice: string, speaker?: number): Promise<{ file: Blob }>
    destroy(): void
  }
}
