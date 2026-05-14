import { flushCache } from '../lib/db.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'ClearCache',
  command: ['clearcache', 'cc'],
  category: 'owner',
  description: 'Clear memory cache dan DB cache',
  ownerOnly: true,
  cooldown: 10000,

  async execute({ sock, m, chat }) {
    const before = process.memoryUsage().rss
    flushCache()
    if (global.gc) global.gc()
    const after  = process.memoryUsage().rss
    const freed  = ((before - after) / 1024 / 1024).toFixed(1)

    await sock.sendMessage(chat, {
      text: `Cache cleared.\nMemory freed: ${freed} MB\nCurrent RAM: ${(after / 1024 / 1024).toFixed(1)} MB`,
      contextInfo: makeAdReply('Clear Cache', `Freed ${freed} MB`),
    }, { quoted: m })
  },
}
