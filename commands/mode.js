import { config } from '../config/index.js'
import { getDB, saveDB } from '../lib/db.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'Mode',
  command: ['self', 'public'],
  category: 'owner',
  description: 'Toggle self/public mode bot',
  ownerOnly: true,
  cooldown: 3000,

  async execute({ sock, m, chat, body }) {
    const cmd = body.split(' ')[0].toLowerCase()
    const db  = await getDB()
    db.settings = db.settings || {}

    if (cmd === 'self') {
      config.publicMode = false
      db.settings.publicMode = false
    } else {
      config.publicMode = true
      db.settings.publicMode = true
    }

    await saveDB(db)

    await sock.sendMessage(chat, {
      text: `Bot sekarang dalam mode *${cmd === 'self' ? 'Self' : 'Public'}*.`,
      contextInfo: makeAdReply('Mode Bot', cmd === 'self' ? 'Self Mode' : 'Public Mode'),
    }, { quoted: m })
  },
}
