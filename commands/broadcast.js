import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'Broadcast',
  command: ['bc', 'broadcast'],
  category: 'owner',
  description: 'Broadcast pesan ke semua chat',
  ownerOnly: true,
  cooldown: 30000,

  async execute({ sock, m, chat, body, message, quoted }) {
    const text = body.replace(/^(bc|broadcast)\s*/i, '').trim()
    if (!text) {
      await sock.sendMessage(chat, { text: 'Usage: bc <pesan>' }, { quoted: m })
      return
    }

    const chats = [...(sock.store?.chats?.all?.() || [])]
      .filter(c => c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@g.us'))
      .map(c => c.id)

    if (!chats.length) {
      await sock.sendMessage(chat, { text: 'Tidak ada chat yang ditemukan.' }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, {
      text: `Memulai broadcast ke ${chats.length} chat...`,
    }, { quoted: m })

    let sent = 0, fail = 0
    for (const jid of chats) {
      try {
        await sock.sendMessage(jid, { text })
        sent++
        await new Promise(r => setTimeout(r, 500))
      } catch { fail++ }
    }

    await sock.sendMessage(chat, {
      text: `Broadcast selesai.\nSent: ${sent}\nFail: ${fail}`,
      contextInfo: makeAdReply('Broadcast', `${sent}/${chats.length} terkirim`),
    }, { quoted: m })
  },
}
