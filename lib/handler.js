import { checkOwner, resolveJID } from './utils.js'
import { logger } from './logger.js'
import { config } from '../config/index.js'
import { isBlacklisted } from './db.js'

const cooldown = new Map()

export async function messageHandler(sock, m, commands, startTime) {
  try {
    if (!m.message) return
    if (m.key.fromMe) return

    const msg     = m.message
    const msgType = Object.keys(msg)[0]

    let body = ''
    if (msg.conversation)                  body = msg.conversation
    else if (msg.extendedTextMessage?.text) body = msg.extendedTextMessage.text
    else if (msg.imageMessage?.caption)    body = msg.imageMessage.caption
    else if (msg.videoMessage?.caption)    body = msg.videoMessage.caption
    else if (msg.interactiveResponseMessage) {
      try {
        const p = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || '{}')
        body = p.id || msg.interactiveResponseMessage.body?.text || ''
      } catch { body = msg.interactiveResponseMessage.body?.text || '' }
    } else if (msg.buttonsResponseMessage)
      body = msg.buttonsResponseMessage.selectedButtonId || ''
    else if (msg.listResponseMessage)
      body = msg.listResponseMessage.singleSelectReply?.selectedRowId || ''

    body = body.trim()
    if (!body) return

    const chat      = m.key.remoteJid
    const isGroup   = chat.endsWith('@g.us')
    const rawSender = (isGroup ? m.key.participant : m.key.remoteJid) || ''
    const sender    = await resolveJID(rawSender, sock)
    const owner     = await checkOwner(rawSender, sock)

    if (!owner && !config.publicMode && !isGroup) return
    if (await isBlacklisted(sender)) return

    const ctxInfo = msg.extendedTextMessage?.contextInfo
      || msg.imageMessage?.contextInfo
      || msg.videoMessage?.contextInfo
      || msg.audioMessage?.contextInfo
      || msg.documentMessage?.contextInfo
      || msg.stickerMessage?.contextInfo
      || null

    const quotedMsg       = ctxInfo?.quotedMessage
    const quotedRawSender = ctxInfo?.participant || ''
    const quotedSender    = quotedRawSender ? await resolveJID(quotedRawSender, sock) : ''

    const quoted = quotedMsg
      ? {
          message: quotedMsg,
          sender: quotedSender,
          rawSender: quotedRawSender,
          stanzaId: ctxInfo.stanzaId || '',
          key: { remoteJid: chat, id: ctxInfo.stanzaId, participant: quotedRawSender, fromMe: false },
          mQuoted: { key: { remoteJid: chat, id: ctxInfo.stanzaId, participant: quotedRawSender, fromMe: false }, message: quotedMsg },
        }
      : null

    const args    = body.split(' ')
    const cmdName = args[0].toLowerCase()
    const cmdArgs = args.slice(1)

    const cmd = commands.get(cmdName)
    if (!cmd) return

    if (cmd.ownerOnly && !owner) {
      await sock.sendMessage(chat, { text: 'Access denied.' }, { quoted: m })
      return
    }

    const cdKey  = `${sender}:${cmdName}`
    const now    = Date.now()
    const last   = cooldown.get(cdKey) || 0
    const cdTime = cmd.cooldown ?? 3000
    if (now - last < cdTime) {
      const rem = ((cdTime - (now - last)) / 1000).toFixed(1)
      await sock.sendMessage(chat, { text: `Cooldown ${rem}s` }, { quoted: m })
      return
    }
    cooldown.set(cdKey, now)

    logger.cmd(cmdName, sender)

    await cmd.execute({
      sock, m, args: cmdArgs, body, chat, sender, rawSender,
      isGroup, quoted, message: msg, msgType, isOwner: owner, startTime,
    })
  } catch (err) {
    logger.error(`Handler: ${err.message}`)
  }
}
