import { makeAdReply } from '../lib/externalAdReply.js'
import { getGroup, saveGroup, getWarn, setWarn, addBlacklist } from '../lib/db.js'
import { makeGroupReport, makeHeatmap } from '../lib/canvas.js'

async function getAdmins(sock, chat) {
  const meta = await sock.groupMetadata(chat)
  return meta.participants.filter(p => p.admin).map(p => p.id)
}

async function requireGroup(sock, m, chat) {
  if (!chat.endsWith('@g.us')) {
    await sock.sendMessage(chat, { text: 'Command ini hanya untuk grup.' }, { quoted: m })
    return false
  }
  return true
}

async function requireAdmin(sock, m, chat, sender) {
  const admins = await getAdmins(sock, chat)
  if (!admins.includes(sender)) {
    await sock.sendMessage(chat, { text: 'Hanya admin yang bisa menggunakan command ini.' }, { quoted: m })
    return false
  }
  return true
}

function resolveTarget(args, quoted) {
  if (quoted?.sender) return quoted.sender
  if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, '')
    return num ? `${num}@s.whatsapp.net` : null
  }
  return null
}

const COMMANDS = {
  welcome: true, goodbye: true, antitoxic: true, antispam: true,
  antilink: true, antidel: true, antiviewonce: true, only62: true,
}

export default {
  name: 'GroupManager',
  command: [
    'welcome', 'goodbye', 'antitoxic', 'antispam', 'antilink', 'antidel',
    'antiviewonce', 'only62', 'addmem', 'kick', 'promote', 'demote',
    'warn', 'hidetag', 'open', 'close', 'rstlgroup', 'listadmin',
    'setbiogb', 'groupreport', 'blgroup', 'afk', 'reminder', 'heatmap',
  ],
  category: 'group',
  description: 'Group management commands',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, sender, args, body, quoted, isGroup, isOwner }) {
    if (!isGroup) {
      await sock.sendMessage(chat, { text: 'Command ini hanya untuk grup.' }, { quoted: m })
      return
    }

    const cmd   = body.split(' ')[0].toLowerCase()
    const group = await getGroup(chat)
    let meta

    try { meta = await sock.groupMetadata(chat) } catch {
      await sock.sendMessage(chat, { text: 'Gagal ambil info grup.' }, { quoted: m })
      return
    }

    const admins  = meta.participants.filter(p => p.admin).map(p => p.id)
    const isAdmin = admins.includes(sender)
    const botId   = sock.user?.id
    const botAdmin = admins.includes(botId)

    const needAdmin = !isAdmin && !isOwner
    const reply     = async (txt) => sock.sendMessage(chat, {
      text: txt,
      contextInfo: makeAdReply('Group Manager', cmd),
    }, { quoted: m })

    if (COMMANDS[cmd] !== undefined) {
      if (needAdmin) return reply('Hanya admin yang bisa menggunakan ini.')
      const state = args[0]?.toLowerCase()
      if (!['on', 'off'].includes(state)) return reply(`Usage: ${cmd} on/off`)
      group[cmd] = state === 'on'
      await saveGroup(chat, group)
      return reply(`${cmd} ${state === 'on' ? 'diaktifkan' : 'dinonaktifkan'}.`)
    }

    if (cmd === 'addmem') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      try {
        await sock.groupParticipantsUpdate(chat, [target], 'add')
        reply(`@${target.split('@')[0]} berhasil ditambahkan.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'kick') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      try {
        await sock.groupParticipantsUpdate(chat, [target], 'remove')
        reply(`@${target.split('@')[0]} berhasil dikick.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'promote') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      try {
        await sock.groupParticipantsUpdate(chat, [target], 'promote')
        reply(`@${target.split('@')[0]} dijadikan admin.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'demote') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      try {
        await sock.groupParticipantsUpdate(chat, [target], 'demote')
        reply(`@${target.split('@')[0]} dicopot dari admin.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'warn') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      const maxWarn = parseInt(args[1]) || 3
      const current = await getWarn(target, chat)
      const next    = current + 1
      await setWarn(target, chat, next)
      if (next >= maxWarn) {
        await setWarn(target, chat, 0)
        try { await sock.groupParticipantsUpdate(chat, [target], 'remove') } catch {}
        return reply(`@${target.split('@')[0]} telah dikick karena ${maxWarn}x warn.`)
      }
      return reply(`@${target.split('@')[0]} mendapat warn ${next}/${maxWarn}.`)
    }

    if (cmd === 'hidetag') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      const text = body.replace(/^hidetag\s*/i, '').trim() || '.'
      const all  = meta.participants.map(p => p.id)
      await sock.sendMessage(chat, { text, mentions: all })
      return
    }

    if (cmd === 'open' || cmd === 'close') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const setting = cmd === 'open' ? 'not_announcement' : 'announcement'
      try {
        await sock.groupSettingUpdate(chat, setting)
        reply(`Grup ${cmd === 'open' ? 'dibuka' : 'ditutup'}.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'rstlgroup') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      try {
        const code = await sock.groupInviteCode(chat)
        await sock.groupRevokeInvite(chat)
        const newCode = await sock.groupInviteCode(chat)
        reply(`Link grup berhasil direset.\nhttps://chat.whatsapp.com/${newCode}`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'listadmin') {
      const lines = admins.map(a => `@${a.split('@')[0]}`).join('\n')
      return sock.sendMessage(chat, {
        text: `Admin grup (${admins.length}):\n${lines}`,
        mentions: admins,
        contextInfo: makeAdReply('List Admin', `${admins.length} admin`),
      }, { quoted: m })
    }

    if (cmd === 'setbiogb') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      if (!botAdmin) return reply('Bot bukan admin.')
      const desc = body.replace(/^setbiogb\s*/i, '').trim()
      if (!desc) return reply('Usage: setbiogb <teks>')
      try {
        await sock.groupUpdateDescription(chat, desc)
        reply(`Deskripsi grup berhasil diset.`)
      } catch (e) { reply(`Gagal: ${e.message}`) }
      return
    }

    if (cmd === 'blgroup') {
      if (needAdmin) return reply('Hanya admin yang bisa.')
      const target = resolveTarget(args, quoted)
      if (!target) return reply('Sebutkan nomor atau reply pesan user.')
      await addBlacklist(target)
      try { await sock.groupParticipantsUpdate(chat, [target], 'remove') } catch {}
      return reply(`@${target.split('@')[0]} di-blacklist dari grup.`)
    }

    if (cmd === 'afk') {
      const { setAfk } = await import('../lib/db.js')
      const reason = body.replace(/^afk\s*/i, '').trim() || 'tidak ada alasan'
      await setAfk(sender, reason)
      return reply(`@${sender.split('@')[0]} sekarang AFK: ${reason}`)
    }

    if (cmd === 'reminder') {
      const parts  = body.replace(/^reminder\s*/i, '').split('|')
      const text   = parts[0]?.trim()
      const timeMs = parseInt(parts[1]?.trim()) * 60 * 1000
      if (!text || isNaN(timeMs)) return reply('Usage: reminder <teks>|<menit>')
      setTimeout(async () => {
        await sock.sendMessage(chat, {
          text: `Reminder: ${text}`,
          mentions: [sender],
          contextInfo: makeAdReply('Reminder', text.slice(0, 50)),
        })
      }, timeMs)
      return reply(`Reminder diset: "${text}" dalam ${parts[1].trim()} menit.`)
    }

    if (cmd === 'groupreport') {
      const msgs    = group.messages || {}
      const sorted  = Object.entries(msgs).sort((a, b) => b[1] - a[1])
      const total   = sorted.reduce((s, [, c]) => s + c, 0)
      const topUsers = sorted.slice(0, 10).map(([jid, count]) => ({
        name: jid.split('@')[0],
        count,
      }))

      const img = await makeGroupReport({
        groupName: meta.subject,
        members: meta.participants.length,
        totalMessages: total,
        topUsers,
      })

      return sock.sendMessage(chat, {
        image: img,
        caption: `Group Report — ${meta.subject}\nTotal members: ${meta.participants.length}\nTotal messages: ${total}`,
        contextInfo: makeAdReply('Group Report', meta.subject),
      }, { quoted: m })
    }

    if (cmd === 'heatmap') {
      const db       = await (await import('../lib/db.js')).getDB()
      const hourlyData = Array(7 * 24).fill(0)
      const heatGroup  = db.groups?.[chat]

      if (heatGroup?.hourly) {
        Object.assign(hourlyData, heatGroup.hourly)
      }

      const img = await makeHeatmap({
        groupName: meta.subject,
        hourlyData,
      })

      return sock.sendMessage(chat, {
        image: img,
        caption: `Activity Heatmap — ${meta.subject}`,
        contextInfo: makeAdReply('Group Heatmap', meta.subject),
      }, { quoted: m })
    }
  },
}
