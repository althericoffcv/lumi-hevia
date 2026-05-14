import { makeAdReply } from '../lib/externalAdReply.js'
import axios from 'axios'

export default {
  name: 'GetPP',
  command: ['getpp'],
  category: 'tools',
  description: 'Ambil foto profil user',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, args, quoted }) {
    let target = quoted?.sender || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

    if (!target) {
      await sock.sendMessage(chat, { text: 'Usage: getpp <nomor> atau reply pesan user.' }, { quoted: m })
      return
    }

    try {
      const url = await sock.profilePictureUrl(target, 'image')
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 })
      const buf = Buffer.from(res.data)

      await sock.sendMessage(chat, {
        image: buf,
        caption: `Foto profil @${target.split('@')[0]}`,
        mentions: [target],
        contextInfo: makeAdReply('Get Profile', `@${target.split('@')[0]}`),
      }, { quoted: m })
    } catch {
      await sock.sendMessage(chat, { text: 'Foto profil tidak tersedia atau akun tidak ada.' }, { quoted: m })
    }
  },
}
