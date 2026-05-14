import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { makeAdReply } from '../lib/externalAdReply.js'

const exec = promisify(execFile)

async function toWebp(input, output, animated = false) {
  const args = animated
    ? [input, '-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15', '-loop', '0', '-ss', '00:00:00', '-t', '00:00:05', '-preset', 'icon', '-an', '-vsync', '0', output]
    : [input, '-vf', 'scale=512:512', output]
  await exec('ffmpeg', args)
}

export default {
  name: 'Sticker',
  command: ['sticker', 's'],
  category: 'tools',
  description: 'Convert image/video/gif ke sticker WA',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, quoted, message, msgType }) {
    const target = quoted?.message || message
    const type   = quoted ? Object.keys(quoted.message)[0] : msgType

    const isImg = type === 'imageMessage'
    const isVid = type === 'videoMessage'
    const isGif = type === 'videoMessage' && (target?.videoMessage?.gifPlayback || type === 'gifMessage')

    if (!isImg && !isVid && !isGif) {
      await sock.sendMessage(chat, {
        text: 'Reply ke foto/video/gif untuk dijadikan sticker.',
        contextInfo: makeAdReply('Sticker', 'img/vid/gif to sticker'),
      }, { quoted: m })
      return
    }

    const buf = await downloadMediaMessage(
      { key: quoted?.key || m.key, message: target },
      'buffer', {},
      { logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} }, reuploadRequest: sock.updateMediaMessage }
    )

    const id      = randomBytes(4).toString('hex')
    const ext     = isImg ? 'jpg' : 'mp4'
    const inPath  = join(tmpdir(), `stk_in_${id}.${ext}`)
    const outPath = join(tmpdir(), `stk_out_${id}.webp`)

    await writeFile(inPath, buf)

    try {
      await toWebp(inPath, outPath, isVid || isGif)
      const webp = await (await import('fs/promises')).readFile(outPath)
      await sock.sendMessage(chat, {
        sticker: webp,
        mimetype: 'image/webp',
      }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal convert: ${e.message}` }, { quoted: m })
    } finally {
      try { await unlink(inPath) } catch {}
      try { await unlink(outPath) } catch {}
    }
  },
}
