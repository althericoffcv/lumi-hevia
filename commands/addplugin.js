import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

const __dirname = join(fileURLToPath(import.meta.url), '..', '..')
const COMMANDS_DIR = join(__dirname, 'commands')

export default {
  name: 'AddPlugin',
  command: ['addplugin'],
  category: 'developer',
  description: 'Tambah plugin baru dari reply code / file .js (owner only)',
  ownerOnly: true,
  cooldown: 3000,

  async execute({ sock, m, chat, args, body, quoted }) {
    // ─── INLINE CODE ───────────────────────────────────────────
    // Usage: addplugin namafile.js
    // (reply ke pesan yang isinya code JS)

    // ─── HELP ──────────────────────────────────────────────────
    if (!args[0] && !quoted) {
      await sock.sendMessage(chat, {
        text: [
          `*[ ADDPLUGIN ]*`,
          ``,
          `Cara pakai:`,
          ``,
          `1. Reply pesan berisi code JS:`,
          `   addplugin namafile`,
          `   (ekstensi .js otomatis ditambah)`,
          ``,
          `2. Reply file dokumen .js:`,
          `   addplugin`,
          `   (nama file dari dokumen dipakai)`,
          ``,
          `Contoh:`,
          `   addplugin myplugin`,
          `   addplugin myplugin.js`,
        ].join('\n'),
      }, { quoted: m })
      return
    }

    let fileName = null
    let codeBuffer = null

    // ─── CASE 1: Reply ke dokumen .js ──────────────────────────
    const docMsg = quoted?.message?.documentMessage
    if (docMsg) {
      const docName = docMsg.fileName || ''
      if (extname(docName).toLowerCase() !== '.js' && docMsg.mimetype !== 'application/javascript') {
        await sock.sendMessage(chat, { text: '❌ File harus berekstensi .js' }, { quoted: m })
        return
      }

      // Nama file: pakai args[0] jika ada, fallback ke nama dokumen
      fileName = args[0]
        ? (args[0].endsWith('.js') ? args[0] : args[0] + '.js')
        : docName

      try {
        codeBuffer = await downloadMediaMessage(
          { key: quoted.key, message: quoted.message },
          'buffer',
          {},
          {
            logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} },
            reuploadRequest: sock.updateMediaMessage,
          }
        )
      } catch (e) {
        await sock.sendMessage(chat, { text: `❌ Gagal download file: ${e.message}` }, { quoted: m })
        return
      }

    // ─── CASE 2: Reply ke pesan teks (code) ────────────────────
    } else if (quoted?.message) {
      const textMsg = quoted.message?.conversation
        || quoted.message?.extendedTextMessage?.text
        || null

      if (!textMsg) {
        await sock.sendMessage(chat, { text: '❌ Quote pesan teks berisi code JS atau file .js.' }, { quoted: m })
        return
      }

      if (!args[0]) {
        await sock.sendMessage(chat, { text: '❌ Sertakan nama file.\nContoh: addplugin myplugin' }, { quoted: m })
        return
      }

      fileName = args[0].endsWith('.js') ? args[0] : args[0] + '.js'
      codeBuffer = Buffer.from(textMsg, 'utf-8')

    } else {
      await sock.sendMessage(chat, {
        text: '❌ Reply ke pesan code atau file .js dulu.\nKetik addplugin untuk bantuan.',
      }, { quoted: m })
      return
    }

    // ─── VALIDASI NAMA FILE ────────────────────────────────────
    if (!/^[a-zA-Z0-9_\-]+\.js$/.test(fileName)) {
      await sock.sendMessage(chat, {
        text: '❌ Nama file tidak valid. Gunakan huruf, angka, underscore, atau dash.',
      }, { quoted: m })
      return
    }

    // ─── TULIS FILE ────────────────────────────────────────────
    const destPath = join(COMMANDS_DIR, fileName)
    const isUpdate = existsSync(destPath)

    try {
      if (!existsSync(COMMANDS_DIR)) await mkdir(COMMANDS_DIR, { recursive: true })
      await writeFile(destPath, codeBuffer)
    } catch (e) {
      await sock.sendMessage(chat, { text: `❌ Gagal menyimpan plugin: ${e.message}` }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, {
      text: [
        `*[ ${isUpdate ? 'UPDATE' : 'ADD'} PLUGIN ]*`,
        ``,
        `✅ Plugin berhasil ${isUpdate ? 'diperbarui' : 'ditambahkan'}!`,
        ``,
        `📄 File  : ${fileName}`,
        `📦 Size  : ${(codeBuffer.length / 1024).toFixed(2)} KB`,
        `📁 Path  : commands/${fileName}`,
        ``,
        isUpdate
          ? `♻️ Plugin direload otomatis oleh watcher.`
          : `🚀 Plugin dimuat otomatis oleh watcher.`,
      ].join('\n'),
    }, { quoted: m })
  },
}
