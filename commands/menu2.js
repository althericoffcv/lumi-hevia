import axios from 'axios'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { config } from '../config/index.js'
import { getRuntime, getImageQuery, getGreeting } from '../lib/utils.js'

export default {
  name: 'Menu2',
  command: ['menu2', 'help2'],
  category: 'general',
  description: 'Show bot menu',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, startTime }) {
    const t0      = Date.now()
    const runtime = getRuntime(startTime)
    const query   = getImageQuery()
    const greeting = getGreeting()

    let thumbUrl = null
    let media    = null
    try {
      const res  = await axios.get(`${config.himmelApi}/search/pinterest?q=${query}`, { timeout: 6000 })
      const list = res.data?.data
      if (list?.length) {
        const pick = list[Math.floor(Math.random() * list.length)]
        thumbUrl   = pick.image
        media      = await prepareWAMessageMedia(
          { image: { url: thumbUrl } },
          { upload: sock.waUploadToServer }
        )
      }
    } catch {}

    const speed = `${Date.now() - t0} ms`

    const bodyText = greeting

    const footerText = [
      `𝗡𝗮𝗺𝗲    : 𝗟𝘂𝗺𝗶 𝗛𝗲𝘃𝗶𝗮`,
      `𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 𝗔𝗹𝗽𝗵𝗮`,
      `𝗔𝘂𝘁𝗵𝗼𝗿  : 𝗕𝗮𝘆𝘂 𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹`,
      ``,
      `𝗥𝘂𝗻𝘁𝗶𝗺𝗲 : ${runtime}`,
      `𝗦𝗽𝗲𝗲𝗱   : ${speed}`,
      ``,
      `メニューを使って開始`,
    ].join('\n')

    const sections = [
      {
        title: 'General',
        highlight_label: 'Lumi Hevia',
        rows: [
          { header: 'menu',     title: 'menu',     description: 'Show this menu',              id: 'menu'     },
          { header: 'ping',     title: 'ping',     description: 'Check bot speed',             id: 'ping'     },
          { header: 'button',   title: 'button',   description: 'Test all button types',       id: 'button'   },
          { header: 'pin',      title: 'pin',      description: 'Search foto Pinterest',       id: 'pin'      },
          { header: 'httpx',    title: 'httpx',    description: 'Download website assets ZIP', id: 'httpx'    },
          { header: 'lid',      title: 'lid',      description: 'Convert JID to LID',          id: 'lid'      },
          { header: 'jid',      title: 'jid',      description: 'Get JID info',                id: 'jid'      },
          { header: 'qcontact', title: 'qcontact', description: 'Quoted contact info',         id: 'qcontact' },
        ],
      },
      {
        title: 'Developer (Owner)',
        highlight_label: 'Owner Only',
        rows: [
          { header: 'crm',     title: 'crm',     description: 'Generate relay code',       id: 'crm'     },
          { header: 'run',     title: 'run',     description: 'Eksekusi JS / relay file',  id: 'run'     },
          { header: 'inspect', title: 'inspect', description: 'Inspect object / eval JS',  id: 'inspect' },
          { header: 'debug',   title: 'debug',   description: 'Debug raw WA payload',      id: 'debug'   },
          { header: 'backup',  title: 'backup',  description: 'Backup project ke ZIP',     id: 'backup'  },
        ],
      },
    ]

    const buttons = [
      {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({ title: 'Pilih Menu', sections }),
      },
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: '𝗣𝗶𝗻𝗴', id: 'ping' }),
      },
    ]

    const header = media?.imageMessage
      ? {
          hasMediaAttachment: true,
          imageMessage: media.imageMessage,
        }
      : {
          hasMediaAttachment: false,
          title: config.botName,
        }

    const quotedContact = {
      key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'LUMI_MENU', participant: '0@s.whatsapp.net' },
      message: {
        contactMessage: {
          displayName: '🍏',
          vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Meta;;;\nFN:Meta\nTEL;type=Mobile;waid=13135550002:+13135550002\nEND:VCARD',
        },
      },
    }

    const msg = generateWAMessageFromContent(chat, {
      interactiveMessage: {
        header,
        body:   { text: bodyText },
        footer: { text: footerText },
        nativeFlowMessage: {
          messageParamsJson: '',
          buttons,
        },
      },
    }, { quoted: quotedContact })

    await sock.relayMessage(msg.key.remoteJid, msg.message, {
      messageId: msg.key.id,
      additionalNodes: [{
        tag: 'biz',
        attrs: {},
        content: [{
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
        }],
      }],
    })
  },
}
