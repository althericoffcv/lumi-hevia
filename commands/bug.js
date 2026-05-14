import axios from 'axios'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'

const CATALOG_PHONE = '62895406178006'

// IMG BUFFER 1x1 pixel
const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
const imgUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`

async function sendButtonOnly(sock, chat) {
  const quotedContact = {
    key: {
      remoteJid: '0@s.whatsapp.net',
      fromMe: false,
      id: 'LUMI_BUTTON',
      participant: '0@s.whatsapp.net',
    },
    message: {
      contactMessage: {
        displayName: 'Webview',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Meta;;;\nFN:Meta\nTEL;type=Mobile;waid=13135550002:+13135550002\nEND:VCARD',
      },
    },
  }

  const msg = generateWAMessageFromContent(
    chat,
    {
      interactiveMessage: {
        body: { 
          text: '🎨 *Hasil Webview*\n\nKlik tombol dibawah untuk melihat screenshot' 
        },
        footer: { text: 'Lumi Hevia | Webview Tools' },
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [0, 1],
              list_title: 'Webview Options',
              button_title: 'Pilih Aksi',
            },
            tap_target_configuration: {
              title: 'Webview Result',
              description: 'Lihat screenshot disini',
              canonical_url: `https://wa.me/${CATALOG_PHONE}`,
              domain: `https://wa.me/${CATALOG_PHONE}`,
              button_index: 0,
            },
          }),
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: '📸 Lihat Screenshot',
                url: imgUrl,
                merchant_url: imgUrl,
              }),
            },
            {
              name: 'cta_catalog',
              buttonParamsJson: JSON.stringify({
                business_phone_number: CATALOG_PHONE,
                icon: 'DEFAULT',
              }),
            },
          ],
        },
      },
    },
    { quoted: quotedContact }
  )

  await sock.relayMessage(msg.key.remoteJid, msg.message, {
    messageId: msg.key.id,
    additionalNodes: [
      {
        tag: 'biz',
        attrs: {},
        content: [
          {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
          },
        ],
      },
    ],
  })
}

export default {
  name: 'Webview',
  command: ['bug', 'he'],
  category: 'tools',
  description: 'Kirim button CTA URL + Catalog dengan bottom sheet',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat }) {
    await sendButtonOnly(sock, chat)
    await sock.sendMessage(chat, { react: { text: "✅", key: m.key } })
  },
}