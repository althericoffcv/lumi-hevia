import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'SetProfile',
  command: ['setpp'],
  category: 'owner',
  description: 'Set foto profil bot',
  ownerOnly: true,
  cooldown: 10000,

  async execute({ sock, m, chat, quoted, message, msgType }) {
    const target = quoted?.message || message
    const type   = quoted ? Object.keys(quoted.message)[0] : msgType

    if (type !== 'imageMessage') {
      await sock.sendMessage(chat, { text: 'Reply ke foto untuk set profil bot.' }, { quoted: m })
      return
    }

    const buf = await downloadMediaMessage(
      { key: quoted?.key || m.key, message: target },
      'buffer', {},
      { logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} }, reuploadRequest: sock.updateMediaMessage }
    )

    try {
      await sock.updateProfilePicture(sock.user.id, buf)
      await sock.sendMessage(chat, {
        text: 'Foto profil bot berhasil diupdate.',
        contextInfo: makeAdReply('Set Profile', 'Profile picture updated'),
      }, { quoted: m })
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal: ${e.message}` }, { quoted: m })
    }
  },
}
