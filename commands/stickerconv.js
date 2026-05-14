import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { makeAdReply } from '../lib/externalAdReply.js'

const exec = promisify(execFile)

export default {
  name: 'StickerConv',
  command: ['toimg', 'tovid', 'togif'],
  category: 'tools',
  description: 'Convert sticker ke image/video/gif',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, quoted, body }) {
    const cmd = body.split(' ')[0].toLowerCase()

    if (!quoted?.message?.stickerMessage) {
      await sock.sendMessage(chat, {
        text: 'Reply ke sticker dulu.',
        contextInfo: makeAdReply('Sticker Convert', 'sticker to img/vid/gif'),
      }, { quoted: m })
      return
    }

    const buf = await downloadMediaMessage(
      { key: quoted.key, message: quoted.message },
      'buffer', {},
      { logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} }, reuploadRequest: sock.updateMediaMessage }
    )

    const id      = randomBytes(4).toString('hex')
    const inPath  = join(tmpdir(), `stkconv_${id}.webp`)
    let   outPath, ext, outMime, isImg

    if (cmd === 'toimg') { outPath = join(tmpdir(), `stkconv_${id}.jpg`); ext = 'jpg'; outMime = 'image/jpeg'; isImg = true }
    else if (cmd === 'togif') { outPath = join(tmpdir(), `stkconv_${id}.gif`); ext = 'gif'; outMime = 'image/gif'; isImg = false }
    else { outPath = join(tmpdir(), `stkconv_${id}.mp4`); ext = 'mp4'; outMime = 'video/mp4'; isImg = false }

    await writeFile(inPath, buf)

    try {
      await exec('ffmpeg', ['-i', inPath, outPath])
      const out = await readFile(outPath)
      if (isImg) {
        await sock.sendMessage(chat, { image: out, mimetype: outMime }, { quoted: m })
      } else if (ext === 'gif') {
        await sock.sendMessage(chat, { video: out, mimetype: outMime, gifPlayback: true }, { quoted: m })
      } else {
        await sock.sendMessage(chat, { video: out, mimetype: outMime }, { quoted: m })
      }
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal convert: ${e.message}` }, { quoted: m })
    } finally {
      try { await unlink(inPath) } catch {}
      try { await unlink(outPath) } catch {}
    }
  },
}
