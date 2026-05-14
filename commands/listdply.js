import axios from 'axios'
import { config } from '../config/index.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'ListDeploy',
  command: ['listdply'],
  category: 'developer',
  description: 'List semua Vercel deployments',
  ownerOnly: true,
  cooldown: 5000,

  async execute({ sock, m, chat }) {
    if (!config.tokenvercel) {
      await sock.sendMessage(chat, { text: 'Set config.tokenvercel dulu.' }, { quoted: m })
      return
    }
    try {
      const res     = await axios.get('https://api.vercel.com/v6/deployments?limit=10', {
        headers: { Authorization: `Bearer ${config.tokenvercel}` },
      })
      const deploys = res.data.deployments || []
      if (!deploys.length) {
        await sock.sendMessage(chat, { text: 'Tidak ada deployment.' }, { quoted: m })
        return
      }
      const lines = deploys.map((d, i) =>
        `${i + 1}. ${d.name}\n   ID: ${d.uid}\n   URL: https://${d.url}\n   State: ${d.state}`
      ).join('\n\n')

      await sock.sendMessage(chat, {
        text: `*Vercel Deployments*\n\n${lines}`,
        contextInfo: makeAdReply('List Deploy', `${deploys.length} deployments`),
      }, { quoted: m })
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message
      await sock.sendMessage(chat, { text: `Error: ${msg}` }, { quoted: m })
    }
  },
}
