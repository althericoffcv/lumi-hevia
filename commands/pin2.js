import axios from 'axios'
import { config } from '../config/index.js'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'

export default {
  name: 'Pin2',
  command: ['pin2', 'pinterest2'],
  category: 'tools',
  description: 'Search foto Pinterest via Himmel API, dikirim sebagai carousel',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, args }) {
    const query = args.join(' ').trim()

    if (!query) {
      await sock.sendMessage(chat, {
        text: '*[ PIN ]*\n\nUsage: pin <keyword>\nContoh: pin aesthetic night',
      }, { quoted: m })
      return
    }

    await sock.sendMessage(
  chat,
  {
    react: {
      text: "🔍",
      key: m.key
    }
  }
)

    let results = []
    try {
      const res = await axios.get(
        `${config.himmelApi}/search/pinterest?q=${encodeURIComponent(query)}`,
        { timeout: 8000 }
      )
      results = res.data?.data || []
    } catch (e) {
      await sock.sendMessage(chat, { text: `❌ Gagal fetch: ${e.message}` }, { quoted: m })
      return
    }

    if (!results.length) {
      await sock.sendMessage(chat, { text: `😕 Tidak ada hasil untuk "${query}".` }, { quoted: m })
      return
    }

    // Max 10 cards
    const picks = results.sort(() => Math.random() - 0.5).slice(0, 10)

    const cards = []
    for (const item of picks) {
      try {
        const imgRes = await axios.get(item.image, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        const imageBuffer = Buffer.from(imgRes.data)

        const media = await prepareWAMessageMedia(
          { image: imageBuffer },
          { upload: sock.waUploadToServer }
        )

        // Build caption text
        let captionText = ''
        if (item.caption) captionText += `${item.caption}\n`
        if (item.uploader) {
          captionText += `*Uploader:* ${item.uploader.fullname} (@${item.uploader.username})\n`
          captionText += `*Followers:* ${item.uploader.followers}`
        }
        captionText = captionText.trim()

        cards.push({
          header: {
            title: captionText || 'Pinterest',
            hasMediaAttachment: true,
            imageMessage: media.imageMessage,
          },
          body: {
            text:  null,
          },
          footer: {
            text: 'Pinterest Search',
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: 'Source',
                  url: item.source || item.url || 'https://pinterest.com',
                  merchant_url: item.source || item.url || 'https://pinterest.com',
                   icon: "REVIEW",
                }),
              },
            ],
          },
        })
      } catch (e) {
        console.error('Gagal proses gambar:', e.message)
      }
    }

    if (!cards.length) {
      await sock.sendMessage(chat, { text: '❌ Gagal memproses gambar.' }, { quoted: m })
      return
    }

    const msg = generateWAMessageFromContent(chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: {
            body: {
              text: `Hasil Pencarian: *${query}*\nTotal: ${results.length} gambar | Ditampilkan: ${cards.length}`,
            },
            carouselMessage: {
              cards,
            },
          },
        },
      },
    }, { quoted: m })

    await sock.relayMessage(chat, msg.message, { messageId: msg.key.id })
  },
}