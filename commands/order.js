import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'
import axios from 'axios'
const quotedContact = {
      key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'LUMI_MENU', participant: '0@s.whatsapp.net' },
      message: {
        contactMessage: {
          displayName: '🍏',
          vcard: 'BEGIN:VCARD\nVERSION:3.0\nN:;Meta;;;\nFN:Meta\nTEL;type=Mobile;waid=13135550002:+13135550002\nEND:VCARD',
        },
      },
    }

export default {
  name: 'Order',
  command: ['order', 'crmorder'],
  category: 'tools',
  description: 'Kirim order message dengan thumbnail custom',
  ownerOnly: true,
  cooldown: 5000,

  async execute({ sock, m, chat }) {
    try {
      await sock.sendMessage(chat, { react: { text: "📦", key: m.key } })

      let thumbnailBuffer = null
      try {
        const img = await axios.get('https://www.bf-uploader.my.id/f/image/hevia.jpg', {
          responseType: 'arraybuffer'
        })
        thumbnailBuffer = Buffer.from(img.data)
      } catch (e) {
        console.log('Gambar gagal di-download')
      }
      
      const thumbnailBase64 = thumbnailBuffer ? thumbnailBuffer.toString('base64') : ""

      const rawContent = {
        "orderMessage": {
          "orderId": null,
          "thumbnail": thumbnailBase64,
          "itemCount": 505,
          "status": "ACCEPTED",
          "surface": "CATALOG",
          "message": "𝖧𝖾𝗅𝗅𝗈, 𝖲𝖾𝗅𝖺𝗆𝖺𝗍 𝖣𝖺𝗍𝖺𝗇𝗀 𝖽𝗂 𝖫𝗎𝗆𝗂 𝖧𝖾𝗏𝗂𝖺 A𝗅𝗉𝗁𝖺 𝖵𝖾𝗋𝗌𝗂𝗈𝗇. 𝖪𝖾𝗍𝗂𝗄 𝗆𝖾𝗇𝗎 𝗎𝗇𝗍𝗎𝗄 𝗆𝖾𝗅𝗂𝗁𝖺𝗍 𝗌𝖾𝗆𝗎𝖺 𝖿𝗂𝗍𝗎𝗋 𝖻𝗈𝗍 𝗒𝖺𝗇𝗀 𝗍𝖾𝗋𝗌𝖾𝖽𝗂𝖺. 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝖡𝖺𝗒𝗎 𝖮𝖿𝖿𝗂𝖼𝗂𝖺𝗅.",
          "orderTitle": "𝖫𝗎𝗆𝗂 𝖧𝖾𝗏𝗂𝖺 | 𝖠𝗅𝗉𝗁𝖺 𝖵𝖾𝗋𝗌𝗂𝗈𝗇",
          "sellerJid": "114860746633351@lid",
          "token": null,
          "totalAmount1000": "1000000",
          "totalCurrencyCode": "USD",
          "messageVersion": 2
        }
      }

      const msg = generateWAMessageFromContent(chat, rawContent, {
        quoted: quotedContact,
        userJid: sock.user?.id
      })

      await sock.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      })

      await sock.sendMessage(chat, { react: { text: "✅", key: m.key } })
      
    } catch (error) {
      console.error('Error:', error)
      await sock.sendMessage(chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
    }
  }
}