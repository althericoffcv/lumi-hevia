import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'fs'
import { readdir, readFile, stat } from 'fs/promises'
import { join, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

const __dirname = join(fileURLToPath(import.meta.url), '..', '..')

const EXCLUDE = ['node_modules', 'session', '.git', '.npm']

async function getAllFiles(dir, baseDir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    if (EXCLUDE.includes(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      const sub = await getAllFiles(full, baseDir)
      files.push(...sub)
    } else {
      files.push({ full, rel: relative(baseDir, full) })
    }
  }
  return files
}

export default {
  name: 'Backup',
  command: ['backup'],
  category: 'developer',
  description: 'Backup semua file project ke ZIP (owner only)',
  ownerOnly: true,
  cooldown: 30000,

  async execute({ sock, m, chat, args }) {
    const type = args[0]?.toLowerCase() || 'full'
    const validTypes = ['full', 'commands', 'lib', 'config']

    if (!validTypes.includes(type)) {
      await sock.sendMessage(chat, {
        text: [
          `*[ BACKUP ]*`,
          ``,
          `Usage: backup <type>`,
          ``,
          `Types:`,
          `  full     - semua file project`,
          `  commands - hanya folder commands/`,
          `  lib      - hanya folder lib/`,
          `  config   - hanya folder config/`,
        ].join('\n'),
      }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, { text: `Membuat backup [${type}]...` }, { quoted: m })

    const zipPath = join(tmpdir(), `backup_lumi_${type}_${randomBytes(4).toString('hex')}.zip`)

    try {
      let targetDir
      if (type === 'full') {
        targetDir = __dirname
      } else {
        targetDir = join(__dirname, type === 'commands' ? 'commands' : type === 'lib' ? 'lib' : 'config')
      }

      if (!existsSync(targetDir)) {
        await sock.sendMessage(chat, { text: `Folder ${type}/ tidak ditemukan.` }, { quoted: m })
        return
      }

      const files = await getAllFiles(targetDir, __dirname)

      if (!files.length) {
        await sock.sendMessage(chat, { text: 'Tidak ada file untuk di-backup.' }, { quoted: m })
        return
      }

      await new Promise((resolve, reject) => {
        const output  = createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        output.on('close', resolve)
        archive.on('error', reject)
        archive.pipe(output)
        for (const f of files) {
          archive.file(f.full, { name: f.rel })
        }
        archive.finalize()
      })

      const zipBuf  = await readFile(zipPath)
      const zipStat = statSync(zipPath)
      const sizekb  = (zipStat.size / 1024).toFixed(1)
      const now     = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const fname   = `lumi-hevia_${type}_${now}.zip`

      await sock.sendMessage(chat, {
        document: zipBuf,
        mimetype: 'application/zip',
        fileName: fname,
        caption: [
          `*[ BACKUP SELESAI ]*`,
          ``,
          `Type  : ${type}`,
          `Files : ${files.length} file`,
          `Size  : ${sizekb} KB`,
          `Name  : ${fname}`,
        ].join('\n'),
      }, { quoted: m })

    } catch (err) {
      await sock.sendMessage(chat, { text: `Backup error: ${err.message}` }, { quoted: m })
    } finally {
      try { if (existsSync(zipPath)) { const { unlinkSync } = await import('fs'); unlinkSync(zipPath) } } catch {}
    }
  },
}
