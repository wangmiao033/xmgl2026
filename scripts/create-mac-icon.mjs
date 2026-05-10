import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'

const execFile = promisify(execFileCallback)

const [sourceSvg, outputIcns] = process.argv.slice(2)

if (!sourceSvg || !outputIcns) {
  console.error('Usage: node scripts/create-mac-icon.mjs <source.svg> <output.icns>')
  process.exit(1)
}

const sizes = [
  [16, 'icon_16x16.png'],
  [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'],
  [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'],
  [1024, 'icon_512x512@2x.png'],
]

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xmgl-icon-'))
const iconset = path.join(tmpRoot, 'AppIcon.iconset')

try {
  await fs.mkdir(iconset, { recursive: true })

  await Promise.all(
    sizes.map(([size, filename]) =>
      sharp(sourceSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(iconset, filename)),
    ),
  )

  await fs.mkdir(path.dirname(outputIcns), { recursive: true })
  await execFile('iconutil', ['-c', 'icns', iconset, '-o', outputIcns])
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true })
}
