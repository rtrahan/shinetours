import * as GS from '@mkkellogg/gaussian-splats-3d'
import fs from 'fs'

const input = process.argv[2]
const output = process.argv[3]

if (!input || !output) {
  console.error('Usage: node scripts/convert-splat.mjs <input.ply> <output.ksplat>')
  process.exit(1)
}

const fileData = fs.readFileSync(input)
const splatArray = GS.PlyParser.parseToUncompressedSplatArray(
  fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength),
  1
)

const generator = GS.SplatBufferGenerator.getStandardGenerator(5, 2, 0)
const splatBuffer = generator.generateFromUncompressedSplatArray(splatArray)

fs.writeFileSync(output, Buffer.from(splatBuffer.bufferData))
console.log(`Wrote ${output} (${fs.statSync(output).size} bytes)`)
