import util from 'util'

export default {
  name: 'Dcode',
  command: ['dcode', 'decode'],
  category: 'developer',
  description: 'Debug/decode raw WhatsApp payload (owner only)',
  ownerOnly: true,
  cooldown: 1000,

  async execute({ sock, m, chat, quoted, message, body, msgType }) {
    const arg = body.replace(/^(dcode|decode)\s*/i, '').trim().toLowerCase()

    // Target selection
    let target, label

    if (arg === 'q' || arg === 'quoted' || arg === 'reply') {
      // Debug quoted/replied message payload
      if (!quoted) {
        await sock.sendMessage(chat, {
          text: 'Reply ke sebuah pesan dulu, lalu ketik:\ndcode q',
        }, { quoted: m })
        return
      }
      target = {
        _target: 'QUOTED MESSAGE',
        message: quoted.message,
        sender: quoted.sender,
        stanzaId: quoted.stanzaId,
        key: quoted.key,
      }
      label = 'quoted'

    } else if (arg === 'key') {
      // Debug message key
      target = { _target: 'KEY', key: m.key }
      label = 'key'

    } else if (arg === 'ctx' || arg === 'context') {
      // Debug context info
      const ctxInfo = message?.extendedTextMessage?.contextInfo
        || message?.imageMessage?.contextInfo
        || message?.videoMessage?.contextInfo
        || message?.audioMessage?.contextInfo
        || message?.documentMessage?.contextInfo
        || message?.stickerMessage?.contextInfo
        || null
      target = { _target: 'CONTEXT INFO', contextInfo: ctxInfo }
      label = 'contextInfo'

    } else {
      // Default: full incoming message payload
      target = {
        _target: 'FULL MESSAGE',
        key: m.key,
        messageType: msgType,
        message,
        messageTimestamp: m.messageTimestamp,
        pushName: m.pushName,
        broadcast: m.broadcast,
        status: m.status,
        verifiedBizName: m.verifiedBizName,
      }
      label = 'full'
    }

    const raw = util.inspect(target, {
      depth: null,
      colors: false,
      compact: false,
      breakLength: 100,
      maxArrayLength: null,
      maxStringLength: 500,
    })

    const totalLen = raw.length
    let out = raw
    if (out.length > 3500) out = out.slice(0, 3500) + `\n\n... truncated (${totalLen} total chars)\nGunakan: dcode q | dcode key | dcode ctx`

    await sock.sendMessage(
      chat,
      {
        text: [
          `*[ DCODE : ${label.toUpperCase()} ]*`,
          `Type   : ${msgType}`,
          `Length : ${totalLen} chars`,
          ``,
          '```' + out + '```',
        ].join('\n'),
      },
      { quoted: m }
    )
  },
}
