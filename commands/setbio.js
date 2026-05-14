import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'SetBio',
  command: ['setbio'],
  category: 'owner',
  description: 'Set bio/status bot',
  ownerOnly: true,
  cooldown: 10000,

  async execute({ sock, m, chat, args, body }) {
    const bio = body.replace(/^setbio\s*/i, '').trim()
    if (!bio) {
      await sock.sendMessage(chat, { text: 'Usage: setbio <teks>' }, { quoted: m })
      return
    }
    try {
      await sock.updateProfileStatus(bio)
      await sock.sendMessage(chat, {
        text: `Bio bot berhasil diset:\n${bio}`,
        contextInfo: makeAdReply('Set Bio', bio.slice(0, 50)),
      }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal: ${e.message}` }, { quoted: m })
    }
  },
}
