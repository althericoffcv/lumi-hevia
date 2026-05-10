import { resolveJID } from '../lib/utils.js'

export default {
  name: 'JID',
  command: ['jid'],
  category: 'tools',
  description: 'Get JID info dari quoted atau mention',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, args, quoted, sender, rawSender, message }) {
    const entries = [
      { label: 'Your JID (resolved)', jid: sender },
      { label: 'Your RAW (from WA)',  jid: rawSender },
      { label: 'Chat JID',            jid: chat },
    ]

    if (quoted?.sender)    entries.push({ label: 'Quoted Sender JID', jid: quoted.sender })
    if (quoted?.rawSender) entries.push({ label: 'Quoted RAW JID',    jid: quoted.rawSender })

    const mentioned = message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    for (let i = 0; i < mentioned.length; i++) {
      const resolved = await resolveJID(mentioned[i], sock)
      entries.push({ label: `Mention ${i + 1}`,          jid: mentioned[i] })
      entries.push({ label: `Mention ${i + 1} (resolved)`, jid: resolved })
    }

    if (args[0]) {
      const num = args[0].replace(/[^0-9]/g, '')
      if (num) entries.push({ label: 'Input JID', jid: `${num}@s.whatsapp.net` })
    }

    const lines = [`*[ JID INFO ]*`, ``]
    for (const e of entries) {
      lines.push(`*${e.label}:*`)
      lines.push(e.jid || '(kosong)')
      lines.push('')
    }

    await sock.sendMessage(chat, { text: lines.join('\n').trim() }, { quoted: m })
  },
}
