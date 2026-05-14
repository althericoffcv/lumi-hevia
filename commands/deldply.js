import axios from 'axios'
import { config } from '../config/index.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'DelDeploy',
  command: ['deldply'],
  category: 'developer',
  description: 'Hapus Vercel deployment',
  ownerOnly: true,
  cooldown: 5000,

  async execute({ sock, m, chat, args }) {
    const id = args[0]
    if (!id) {
      await sock.sendMessage(chat, { text: 'Usage: deldply <deployment-id>' }, { quoted: m })
      return
    }
    if (!config.tokenvercel) {
      await sock.sendMessage(chat, { text: 'Set config.tokenvercel dulu.' }, { quoted: m })
      return
    }
    try {
      await axios.delete(`https://api.vercel.com/v13/deployments/${id}`, {
        headers: { Authorization: `Bearer ${config.tokenvercel}` },
      })
      await sock.sendMessage(chat, {
        text: `Deployment ${id} berhasil dihapus.`,
        contextInfo: makeAdReply('Delete Deploy', id),
      }, { quoted: m })
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message
      await sock.sendMessage(chat, { text: `Error: ${msg}` }, { quoted: m })
    }
  },
}
