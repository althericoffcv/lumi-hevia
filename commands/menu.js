import axios from 'axios'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'
import { config } from '../config/index.js'
import { getRuntime, getImageQuery, getGreeting } from '../lib/utils.js'

export default {
  name: 'Menu',
  command: ['menu', 'help'],
  category: 'general',
  description: 'Show bot menu',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, startTime }) {
    const t0      = Date.now()
    const runtime = getRuntime(startTime)
    const query   = getImageQuery()
    const greeting = getGreeting()

    const thumbUrl = "https://ik.imagekit.io/bayuofficial/file_000000005d7471faaab4d286560fe345.png"
    let media = null
    try {
      media = await prepareWAMessageMedia(
        { image: { url: thumbUrl } },
        { upload: sock.waUploadToServer }
      )
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
        title: 'General Menu',
        highlight_label: 'Lumi Hevia',
        rows: [
          { title: 'ও 𝖯𝗋𝗈𝖽𝗎𝖼𝗍 𝖮𝗐𝗇𝖾𝗋',     description: 'Show this product',              id: 'product'     },
          { title: 'ও 𝖯𝗂𝗇𝗀',     description: 'Check bot speed',             id: 'ping'     },
          { title: 'ও 𝖡𝗎𝗍𝗍𝗈𝗇',   description: 'Test all button types',       id: 'button'   },
          { title: 'ও 𝖯𝗂𝗇𝗍𝖾𝗋𝖾𝗌𝗍 𝖲𝖾𝖺𝗋𝖼𝗁',      description: 'Search foto Pinterest | Album Message',       id: 'pin'      },
         { title: 'ও 𝖯𝗂𝗇𝗍𝖾𝗋𝖾𝗌𝗍 𝖲𝖾𝖺𝗋𝖼𝗁 𝟤',      description: 'Search foto Pinterest | Carousel Message',       id: 'pin2'      },
          { title: 'ও 𝖧𝗍𝗍𝗉𝗑 𝖶𝖾𝖻',    description: 'Download website assets ZIP', id: 'httpx'    },
          { title: 'ও 𝖳𝗈 𝖫𝗂𝖽',      description: 'Convert JID to LID',          id: 'lid'      },
         { title: 'ও Web Preview',      description: 'Preview your web by sending html',          id: 'webview'      },
          { title: 'ও 𝖳𝗈 𝖩𝗂𝖽',      description: 'Get JID info',                id: 'jid'      },
      ],
      },
      {
        title: 'Developer (Owner)',
        highlight_label: 'Owner Only',
        rows: [
          { title: 'ও 𝖢𝗋𝗆',     description: 'Generate relay code',       id: 'crm'     },
          { title: 'ও 𝖱𝗎𝗇 𝖢𝗈𝖽𝖾',     description: 'Eksekusi JS / relay file',  id: 'run'     },
          { title: 'ও 𝖡𝖺𝖼𝗄𝗎𝗉',  description: 'Backup project ke ZIP',     id: 'backup'  },
        ],
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
          messageParamsJson: JSON.stringify({
            limited_time_offer: {
              text: "Rp : 1,000.00",
              url: "https://chat.whatsapp.com/LF76mRDRwLlI4pdbMi0d5A",},
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [0, 2, 3],
              list_title: "Menu Bot",
              button_title: "Menu Option",
            },
            tap_target_configuration: {
              title: "Pilih Menu",
              description: "List Menu Lumi Hevia",
              canonical_url: "https://wa.me/62895406178006",
              domain: "https://wa.me/62895406178006",
              button_index: 0,
            },
          }),
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "Available Commands",
                sections: sections,
                has_multiple_buttons: true,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Owner",
                url: "https://wa.me/62895406178006",
                merchant_url: "https://wa.me/62895406178006",
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Base Bot",
                url: "https://github.com/althericoffcv/lumi-hevia",
                merchant_url: "https://github.com/althericoffcv/lumi-hevia", icon: "REVIEW",
              }),
            },
            {
              name: "cta_catalog",
              buttonParamsJson: JSON.stringify({
                business_phone_number: "62895406178006", icon: "DEFAULT",
              }),
            },
          ],
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