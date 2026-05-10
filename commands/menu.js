import axios from 'axios'
import { Button } from '../lib/builder.js'
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
    const t0 = Date.now()
    const runtime = getRuntime(startTime)
    const query = getImageQuery()
    const greeting = getGreeting()

    let imageBuffer = null
    try {
      const res = await axios.get(`${config.himmelApi}/search/pinterest?q=${query}`, { timeout: 6000 })
      const list = res.data?.data
      if (list?.length) {
        const pick = list[Math.floor(Math.random() * list.length)]
        const img = await axios.get(pick.image, { responseType: 'arraybuffer', timeout: 8000 })
        imageBuffer = Buffer.from(img.data)
      }
    } catch {}

    const speed = `${Date.now() - t0} ms`

    const footer = [
      `*Name :* ${config.botName}`,
      `*Version :* ${config.version}`,
      `*Author:* ${config.author}`,
      `*Runtime:* ${runtime}`,
      `*Speed:* ${speed}`,
    ].join('\n')

    // Buat quoted contact message
    const quotedContact = {
      key: {
        remoteJid: '0@s.whatsapp.net',
        fromMe: false,
        id: 'QUOTED_CONTACT',
        participant: '0@s.whatsapp.net'
      },
      message: {
        contactMessage: {
          displayName: "🍏",
          vcard: 'BEGIN:VCARD\n' +
            'VERSION:3.0\n' +
            'N:;Meta;;;\n' +
            'FN:Meta\n' +
            'TEL;type=Mobile;waid=13135550002:+13135550002\n' +
            'END:VCARD'
        }
      }
    }

    const btn = new Button()
    btn
      .setSubtitle('Hallo')
      .setTitle(`\`${greeting}\``)
      .setFooter(footer)

    if (imageBuffer) {
      btn.setImage(imageBuffer)
    } else {
      btn.setImage('https://ik.imagekit.io/bayuofficial/20260507_185602.jpg?updatedAt=1778157404581')
    }

    btn
      .addSelection('Available Commands')
      .makeSections('General')
      .makeRow('menu', 'menu', 'Show this menu', 'menu')
      .makeRow('ping', 'ping', 'Check bot speed and system info', 'ping')
      .makeRow('button', 'button', 'Test all button types', 'button')
      .makeSections('Tools')
      .makeRow('httpx', 'httpx', 'Download website assets as ZIP', 'httpx')
      .makeRow('lid', 'lid', 'Convert JID to LID', 'lid')
      .makeRow('jid', 'jid', 'Get JID info', 'jid')
      .makeRow('qcontact', 'qcontact', 'Quoted contact info', 'qcontact')
      .makeSections('Developer (Owner Only)')
      .makeRow('eval', 'eval', 'Execute JavaScript code', 'eval')
      .makeRow('dcode', 'dcode', 'Decode WhatsApp payload', 'dcode')

    await btn.run(chat, sock, quotedContact)
  },
}