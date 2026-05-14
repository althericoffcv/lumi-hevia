import axios from 'axios'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { config } from '../config/index.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'UpdateBase',
  command: ['updatebase'],
  category: 'developer',
  description: 'Download semua file dari GitHub repo dan kirim sebagai ZIP',
  ownerOnly: true,
  cooldown: 30000,

  async execute({ sock, m, chat }) {
    if (!config.tokengithub || !config.usernamegithub || !config.repobase) {
      await sock.sendMessage(chat, { text: 'Set config.tokengithub, usernamegithub, repobase dulu.' }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, { text: 'Downloading repo dari GitHub...' }, { quoted: m })

    const zipPath = join(tmpdir(), `updatebase_${randomBytes(4).toString('hex')}.zip`)

    try {
      const headers = {
        Authorization: `token ${config.tokengithub}`,
        Accept: 'application/vnd.github.v3+json',
      }

      async function listContents(path = '') {
        const url = `https://api.github.com/repos/${config.usernamegithub}/${config.repobase}/contents/${path}`
        const res = await axios.get(url, { headers })
        return res.data
      }

      async function getAllFiles(path = '') {
        const items = await listContents(path)
        const files = []
        for (const item of items) {
          if (item.type === 'file') files.push(item)
          else if (item.type === 'dir') {
            const sub = await getAllFiles(item.path)
            files.push(...sub)
          }
        }
        return files
      }

      const allFiles = await getAllFiles()

      await new Promise((resolve, reject) => {
        const out     = createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 6 } })
        out.on('close', resolve)
        archive.on('error', reject)
        archive.pipe(out)

        let pending = allFiles.length
        if (!pending) { archive.finalize(); return }

        allFiles.forEach(async (file) => {
          try {
            const res = await axios.get(file.download_url, { responseType: 'arraybuffer', headers })
            archive.append(Buffer.from(res.data), { name: file.path })
          } catch {}
          if (--pending === 0) archive.finalize()
        })
      })

      const buf   = await readFile(zipPath)
      const fname = `${config.repobase}_${Date.now()}.zip`

      await sock.sendMessage(chat, {
        document: buf,
        mimetype: 'application/zip',
        fileName: fname,
        caption: `Update base dari ${config.usernamegithub}/${config.repobase}\nFiles: ${allFiles.length}`,
        contextInfo: makeAdReply('Update Base', `${config.repobase} — ${allFiles.length} files`),
      }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(chat, { text: `Error: ${e.message}` }, { quoted: m })
    } finally {
      try { await unlink(zipPath) } catch {}
    }
  },
}
