import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { AIRich } from '../lib/builder.js'

const __dirname = join(fileURLToPath(import.meta.url), '..', '..')
const COMMANDS_DIR = join(__dirname, 'commands')

const MAX_LINES = 1000

export default {
  name: 'GetPlugin',
  command: ['getplugin'],
  category: 'developer',
  description: 'Lihat isi plugin via AIRich (owner only)',
  ownerOnly: true,
  cooldown: 3000,

  async execute({ sock, m, chat, args }) {
    // ─── LIST MODE (no args) ───────────────────────────────────
    if (!args[0]) {
      let files = []
      try {
        const all = await readdir(COMMANDS_DIR)
        files = all.filter(f => f.endsWith('.js')).sort()
      } catch {
        await sock.sendMessage(chat, { text: '❌ Gagal membaca folder commands/' }, { quoted: m })
        return
      }

      if (!files.length) {
        await sock.sendMessage(chat, { text: '📂 Folder commands/ kosong.' }, { quoted: m })
        return
      }

      const rich = new AIRich()
      rich.addText(
        `*[ GETPLUGIN — LIST ]*\n\nTotal: *${files.length}* plugin\n\nKetik \`getplugin <namafile>\` untuk lihat isi.\n`
      )
      rich.addTable([
        ['No', 'Nama File'],
        ...files.map((f, i) => [String(i + 1), f]),
      ])

      try {
        await rich.run(chat, sock, { quoted: m })
      } catch {
        await sock.sendMessage(chat, {
          text: [
            `*[ GETPLUGIN — LIST ]*`,
            `Total: ${files.length} plugin`,
            ``,
            files.map((f, i) => `${i + 1}. ${f}`).join('\n'),
            ``,
            `Ketik: getplugin <namafile>`,
          ].join('\n'),
        }, { quoted: m })
      }
      return
    }

    // ─── VIEW MODE ────────────────────────────────────────────
    let fileName = args[0].trim()
    if (!fileName.endsWith('.js')) fileName += '.js'

    if (!/^[a-zA-Z0-9_\-]+\.js$/.test(fileName)) {
      await sock.sendMessage(chat, { text: '❌ Nama file tidak valid.' }, { quoted: m })
      return
    }

    const filePath = join(COMMANDS_DIR, fileName)

    if (!existsSync(filePath)) {
      await sock.sendMessage(chat, {
        text: `❌ Plugin *${fileName}* tidak ditemukan.\nKetik \`getplugin\` untuk list semua plugin.`,
      }, { quoted: m })
      return
    }

    let code
    try {
      code = await readFile(filePath, 'utf-8')
    } catch (e) {
      await sock.sendMessage(chat, { text: `❌ Gagal membaca file: ${e.message}` }, { quoted: m })
      return
    }

    const lines = code.split('\n')
    const lineCount = lines.length
    const sizeKB = (Buffer.byteLength(code, 'utf-8') / 1024).toFixed(2)
    const isTruncated = lineCount > MAX_LINES

    // Ambil max 1000 baris, tidak kirim dokumen
    const displayCode = isTruncated
      ? lines.slice(0, MAX_LINES).join('\n') + `\n\n// ⚠️ Hanya menampilkan ${MAX_LINES} dari ${lineCount} baris`
      : code

    // ─── Kirim AIRich ─────────────────────────────────────────
    const rich = new AIRich()

    rich.addText(
      [
`「 *GET PLUGIN* 」`,
`*File Name*: ${fileName}`,
`*File Size*: ${sizeKB} KB`,

      ].join('\n')
    )

    rich.addCode('javascript', displayCode)

    try {
      await rich.run(chat, sock, { quoted: m })
    } catch {
      // Fallback teks biasa — potong di 3500 char biar ga crash
      const preview = displayCode.length > 3500
        ? displayCode.slice(0, 3500) + '\n\n// ... (fallback truncated)'
        : displayCode
      await sock.sendMessage(chat, {
        text: [
          `*[ GETPLUGIN ]*`,
          `📄 ${fileName} | ${lineCount} baris | ${sizeKB} KB`,
          ``,
          '```' + preview + '```',
        ].join('\n'),
      }, { quoted: m })
    }
  },
}
