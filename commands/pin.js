import axios from 'axios'
import { config } from '../config/index.js'

export default {
  name: 'Pin',
  command: ['pin', 'pinterest'],
  category: 'tools',
  description: 'Search foto Pinterest via Himmel API, dikirim sebagai album',
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

    await sock.sendMessage(chat, { text: `Mencari "${query}"...` }, { quoted: m })

    let results = []
    try {
      const res = await axios.get(
        `${config.himmelApi}/search/pinterest?q=${encodeURIComponent(query)}`,
        { timeout: 8000 }
      )
      results = res.data?.data || []
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal fetch: ${e.message}` }, { quoted: m })
      return
    }

    if (!results.length) {
      await sock.sendMessage(chat, { text: `Tidak ada hasil untuk "${query}".` }, { quoted: m })
      return
    }

    const picks = results.sort(() => Math.random() - 0.5).slice(0, 6)

    const buffers = []
    for (const item of picks) {
      try {
        const res = await axios.get(item.image, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        buffers.push({ buf: Buffer.from(res.data), item })
      } catch {}
    }

    if (!buffers.length) {
      await sock.sendMessage(chat, { text: 'Gagal download foto.' }, { quoted: m })
      return
    }


    const albumParent = await sock.sendMessage(chat, {
      album: {
        expectedImageCount: buffers.length,
        expectedVideoCount: 0,
      },
    }, { quoted: m })

    const parentKey = albumParent?.key

    if (!parentKey) {

      for (let i = 0; i < buffers.length; i++) {
        const { buf, item } = buffers[i]
        const caption = i === 0
          ? `*[ PIN ]*\nQuery: ${query}\nTotal: ${results.length} | Kirim: ${buffers.length}`
          : ''
        await sock.sendMessage(chat, {
          image: buf,
          caption,
          mimetype: 'image/jpeg',
        }, { quoted: i === 0 ? m : undefined })
        if (i < buffers.length - 1) await new Promise(r => setTimeout(r, 300))
      }
      return
    }

    for (let i = 0; i < buffers.length; i++) {
      const { buf, item } = buffers[i]
      const caption = i === 0
        ? `*[ PIN ]*\nQuery: ${query}\nTotal: ${results.length} | Kirim: ${buffers.length}`
        : ''
      await sock.sendMessage(chat, {
        image: buf,
        caption,
        mimetype: 'image/jpeg',
        albumParentKey: parentKey,
      })
      if (i < buffers.length - 1) await new Promise(r => setTimeout(r, 200))
    }
  },
}
