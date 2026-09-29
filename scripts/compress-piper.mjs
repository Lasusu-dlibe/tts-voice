import { gzip } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'

const gzipAsync = promisify(gzip)
const source = resolve('node_modules/piper-tts-web/dist/piper-tts-web.js')
const destination = resolve('dist/vendor/piper-tts-web.gzbin')

await mkdir(dirname(destination), { recursive: true })
const compressed = await gzipAsync(await readFile(source), { level: 9 })
await writeFile(destination, compressed)
console.log(`Created ${destination} (${compressed.byteLength} bytes)`)
