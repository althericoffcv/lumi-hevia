import axios from 'axios'
import { makeWelcomeCard, makeGoodbyeCard } from './canvas.js'
import { getGroup, saveGroup, trackMessage, isBlacklisted, getAfk, setAfk, getDB, saveDB } from './db.js'
import { logger } from './logger.js'

const TOXIC_WORDS = ['anjing', 'bangsat', 'babi', 'kontol', 'memek', 'kampret', 'bajingan', 'goblok', 'tolol', 'idiot']

async function getAvatar(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 })
    return Buffer.from(res.data)
  } catch { return null }
}

export async function handleGroupEvents(sock, update) {
  try {
    for (const event of update) {
      const { id, participants, action } = event
      const group = await getGroup(id)
      let meta
      try { meta = await sock.groupMetadata(id) } catch { continue }

      if (action === 'add' && group.welcome) {
        for (const p of participants) {
          try {
            const av  = await getAvatar(sock, p)
            const img = await makeWelcomeCard({
              name: meta.participants.find(x => x.id === p)?.notify || p.split('@')[0],
              groupName: meta.subject,
              memberCount: meta.participants.length,
              avatarUrl: av ? `data:image/jpeg;base64,${av.toString('base64')}` : null,
            })
            const txt = group.welcomeMsg
              ? group.welcomeMsg.replace('{name}', `@${p.split('@')[0]}`).replace('{group}', meta.subject)
              : `Selamat datang @${p.split('@')[0]} di ${meta.subject}`
            await sock.sendMessage(id, {
              image: img,
              caption: txt,
              mentions: [p],
            })
          } catch {}
        }
      }

      if (action === 'remove' && group.goodbye) {
        for (const p of participants) {
          try {
            const av  = await getAvatar(sock, p)
            const img = await makeGoodbyeCard({
              name: p.split('@')[0],
              groupName: meta.subject,
              avatarUrl: av ? `data:image/jpeg;base64,${av.toString('base64')}` : null,
            })
            const txt = group.goodbyeMsg
              ? group.goodbyeMsg.replace('{name}', `@${p.split('@')[0]}`).replace('{group}', meta.subject)
              : `Sampai jumpa @${p.split('@')[0]} dari ${meta.subject}`
            await sock.sendMessage(id, {
              image: img,
              caption: txt,
              mentions: [p],
            })
          } catch {}
        }
      }

      if (action === 'add' && group.only62) {
        for (const p of participants) {
          if (!p.startsWith('62')) {
            try { await sock.groupParticipantsUpdate(id, [p], 'remove') } catch {}
          }
        }
      }
    }
  } catch (e) {
    logger.error(`GroupEvents: ${e.message}`)
  }
}

export async function handleIncomingMessage(sock, m, isGroup) {
  if (!isGroup) return
  const chat    = m.key.remoteJid
  const sender  = m.key.participant || m.key.remoteJid
  const msg     = m.message
  const group   = await getGroup(chat)

  await trackMessage(sender, chat)

  const body = msg?.conversation || msg?.extendedTextMessage?.text || msg?.imageMessage?.caption || ''

  if (group.antitoxic && body) {
    const low = body.toLowerCase()
    if (TOXIC_WORDS.some(w => low.includes(w))) {
      try {
        await sock.sendMessage(chat, { delete: m.key })
        await sock.sendMessage(chat, { text: `@${sender.split('@')[0]} pesan dihapus karena mengandung kata toxic.`, mentions: [sender] })
      } catch {}
      return
    }
  }

  if (group.antilink && body) {
    const linkRegex = /(https?:\/\/|wa\.me|bit\.ly|t\.me)/i
    if (linkRegex.test(body)) {
      try {
        const meta  = await sock.groupMetadata(chat)
        const isAdm = meta.participants.find(p => p.id === sender)?.admin
        if (!isAdm) {
          await sock.sendMessage(chat, { delete: m.key })
          await sock.sendMessage(chat, { text: `@${sender.split('@')[0]} link tidak diizinkan.`, mentions: [sender] })
        }
      } catch {}
      return
    }
  }

  if (group.antispam) {
    const now = Date.now()
    if (!group.spamTrack) group.spamTrack = {}
    const st  = group.spamTrack[sender] || { count: 0, first: now }
    if (now - st.first < 5000) {
      st.count++
      if (st.count >= 5) {
        try {
          await sock.sendMessage(chat, { text: `@${sender.split('@')[0]} spam terdeteksi.`, mentions: [sender] })
          await sock.groupParticipantsUpdate(chat, [sender], 'remove')
        } catch {}
        delete group.spamTrack[sender]
        await saveGroup(chat, group)
        return
      }
    } else {
      group.spamTrack[sender] = { count: 1, first: now }
    }
    group.spamTrack[sender] = st
  }

  if (group.antidel) {
    const msgType = Object.keys(msg || {})[0]
    if (msgType === 'protocolMessage' && msg.protocolMessage?.type === 0) {
      try {
        const oriKey = msg.protocolMessage.key
        await sock.sendMessage(chat, { text: `@${sender.split('@')[0]} menghapus sebuah pesan.`, mentions: [sender] })
      } catch {}
    }
  }

  if (group.antiviewonce && msg?.viewOnceMessage) {
    try {
      const inner = msg.viewOnceMessage.message
      const type  = Object.keys(inner)[0]
      if (type === 'imageMessage' || type === 'videoMessage') {
        await sock.sendMessage(chat, inner[type])
      }
    } catch {}
  }

  const afk = await getAfk(sender)
  if (afk) {
    await setAfk(sender, null)
    await sock.sendMessage(chat, { text: `@${sender.split('@')[0]} sudah tidak AFK.`, mentions: [sender] })
  }

  const mentioned = msg?.extendedTextMessage?.contextInfo?.mentionedJid || []
  for (const jid of mentioned) {
    const afkData = await getAfk(jid)
    if (afkData) {
      const elapsed = Math.floor((Date.now() - afkData.since) / 60000)
      await sock.sendMessage(chat, {
        text: `@${jid.split('@')[0]} sedang AFK: ${afkData.reason} (${elapsed} menit lalu)`,
        mentions: [jid],
      })
    }
  }
}
