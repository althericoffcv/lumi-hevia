import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = join(fileURLToPath(import.meta.url), '..', '..')
const COMMANDS_DIR = join(__dirname, 'commands')

// Plugin yang dilindungi — tidak bisa dihapus
const PROTECTED = new Set([
  'addplugin.js',
  'delplugin.js',
  'getplugin.js',
  'backup.js',
  'menu.js',

  'ping.js',
])

export default {
  name: 'DelPlugin',
  command: ['delplugin'],
  category: 'developer',
  description: 'Hapus plugin dari folder commands/ (owner only)',
  ownerOnly: true,
  cooldown: 3000,

  async execute({ sock, m, chat, args }) {
    if (!args[0]) {
      await sock.sendMessage(chat, {
        text: [
          `*[ DELPLUGIN ]*`,
          ``,
          `Usage: delplugin <namafile>`,
          ``,
          `Contoh:`,
          `   delplugin myplugin`,
          `   delplugin myplugin.js`,
          ``,
          `⚠️ Beberapa plugin inti dilindungi dan tidak bisa dihapus.`,
        ].join('\n'),
      }, { quoted: m })
      return
    }

    // Normalisasi nama file
    let fileName = args[0].trim()
    if (!fileName.endsWith('.js')) fileName += '.js'

    // Cek karakter berbahaya (path traversal)
    if (!/^[a-zA-Z0-9_\-]+\.js$/.test(fileName)) {
      await sock.sendMessage(chat, {
        text: '❌ Nama file tidak valid.',
      }, { quoted: m })
      return
    }

    // Cek protected
    if (PROTECTED.has(fileName)) {
      await sock.sendMessage(chat, {
        text: `❌ Plugin *${fileName}* dilindungi dan tidak bisa dihapus.`,
      }, { quoted: m })
      return
    }

    const filePath = join(COMMANDS_DIR, fileName)

    if (!existsSync(filePath)) {
      await sock.sendMessage(chat, {
        text: `❌ Plugin *${fileName}* tidak ditemukan di commands/`,
      }, { quoted: m })
      return
    }

    try {
      await unlink(filePath)
    } catch (e) {
      await sock.sendMessage(chat, {
        text: `❌ Gagal menghapus plugin: ${e.message}`,
      }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, {
      text: [
        `*[ DELPLUGIN ]*`,
        ``,
        `🗑️ Plugin berhasil dihapus!`,
        ``,
        `📄 File  : ${fileName}`,
        `📁 Path  : commands/${fileName}`,
        ``,
        `♻️ Command di-unload otomatis oleh watcher.`,
      ].join('\n'),
    }, { quoted: m })
  },
}
