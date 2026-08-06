import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ -1) >>> 0
}

async function createStoreZip(dir, outFile) {
  const entries = []

  async function collect(relDir) {
    const files = await readdir(path.join(dir, relDir))
    for (const file of files) {
      const rel = path.join(relDir, file)
      const full = path.join(dir, rel)
      const info = await stat(full)
      if (info.isDirectory()) {
        await collect(rel)
      } else {
        entries.push({ rel: rel.split(path.sep).join('/'), data: await readFile(full) })
      }
    }
  }

  await collect('')

  const localParts = []
  const centralParts = []
  let offset = 0

  for (const { rel, data } of entries) {
    const nameBuf = Buffer.from(rel)
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0) // local file header signature
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // method: store
    local.writeUInt16LE(0, 10) // mod time
    local.writeUInt16LE(0x21, 12) // mod date
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28) // extra length
    localParts.push(local, nameBuf, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0) // central directory signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0, 8) // flags
    central.writeUInt16LE(0, 10) // method: store
    central.writeUInt16LE(0, 12) // mod time
    central.writeUInt16LE(0x21, 14) // mod date
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30) // extra length
    central.writeUInt16LE(0, 32) // comment length
    central.writeUInt16LE(0, 34) // disk number start
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42) // local header offset
    centralParts.push(central, nameBuf)

    offset += 30 + nameBuf.length + data.length
  }

  const centralStart = offset
  const centralBuffer = Buffer.concat(centralParts)

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0) // end of central directory signature
  eocd.writeUInt16LE(0, 4) // disk number
  eocd.writeUInt16LE(0, 6) // disk with central dir
  eocd.writeUInt16LE(entries.length, 8) // entries on disk
  eocd.writeUInt16LE(entries.length, 10) // total entries
  eocd.writeUInt32LE(centralBuffer.length, 12)
  eocd.writeUInt32LE(centralStart, 16)
  eocd.writeUInt16LE(0, 20) // comment length

  await writeFile(outFile, Buffer.concat([...localParts, centralBuffer, eocd]))
  return true
}

const sharedFiles = [
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.css',
  'popup.js',
  'options.html',
  'options.js',
  'icons',
]

const DEFAULT_FIREFOX_ID = 'zpatel044@gmail.com'

async function build() {
  const distChrome = path.join(root, 'dist', 'chrome')
  const distFirefox = path.join(root, 'dist', 'firefox')
  const zipOut = path.join(root, 'flashmail-firefox.zip')

  await rm(path.join(root, 'dist'), { recursive: true, force: true })
  await rm(zipOut, { force: true })
  await mkdir(distChrome, { recursive: true })
  await mkdir(distFirefox, { recursive: true })

  for (const file of sharedFiles) {
    await cp(path.join(root, file), path.join(distChrome, file), { recursive: true })
    await cp(path.join(root, file), path.join(distFirefox, file), { recursive: true })
  }

  const chromeManifest = await readFile(path.join(root, 'manifests', 'manifest.chrome.json'), 'utf8')
  await writeFile(path.join(distChrome, 'manifest.json'), chromeManifest)

  const firefoxId = process.env.FIREFOX_EXTENSION_ID || DEFAULT_FIREFOX_ID
  const firefoxManifest = (await readFile(path.join(root, 'manifests', 'manifest.firefox.json'), 'utf8')).replace(
    '__FIREFOX_EXTENSION_ID__',
    firefoxId,
  )
  await writeFile(path.join(distFirefox, 'manifest.json'), firefoxManifest)

  console.log(`Chrome dist:  ${distChrome}`)
  console.log(`Firefox dist: ${distFirefox}  (gecko id: ${firefoxId})`)

  await createStoreZip(distFirefox, zipOut)
  console.log(`Firefox zip:  ${zipOut}`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})

