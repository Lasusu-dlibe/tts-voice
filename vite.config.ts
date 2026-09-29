import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', dest: 'onnx', rename: { stripBase: true } },
        { src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs', dest: 'onnx', rename: { stripBase: true } },
        { src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', dest: 'onnx', rename: { stripBase: true } },
        { src: 'node_modules/piper-tts-web/dist/piper/piper_phonemize.wasm', dest: 'piper', rename: { stripBase: true } },
        { src: 'node_modules/piper-tts-web/dist/piper/piper_phonemize.data', dest: 'piper', rename: { stripBase: true } },
      ],
    }),
  ],
  optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client', 'lucide-react'] },
})
