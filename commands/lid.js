import { resolveLID, resolveJID } from '../lib/utils.js'
import { isLidUser, jidNormalizedUser } from '@whiskeysockets/baileys'

export default {
  name: 'LID',
  command: ['lid'],
  category: 'tools',
  description: 'Convert JID ke LID atau sebaliknya',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, args, quoted, sender }) {
    let input = args[0] || quoted?.sender || sender
    input = jidNormalizedUser(input.replace(/:[0-9]+@/, '@').trim())

    const isAlreadyLid = isLidUser(input)
    let jid, lid, type

    if (isAlreadyLid) {
      lid = input
      const pn = await resolveJID(input, sock)
      jid = pn || '(tidak ditemukan di mapping)'
    } else {
      jid = input
      const l = await resolveLID(input, sock)
      lid = l || '(tidak ditemukan di mapping)'
    }

    type = input.endsWith('@g.us') ? 'Group'
         : input.endsWith('@s.whatsapp.net') ? 'User'
         : input.endsWith('@lid') ? 'LID User'
         : 'Unknown'

    const text = [
      `*[ LID CONVERT ]*`,
      ``,
      `Input  : ${input}`,
      `JID    : ${jid}`,
      `LID    : ${lid}`,
      `Type   : ${type}`,
    ].join('\n')

    await sock.sendMessage(chat, { text }, { quoted: m })
  },
}
