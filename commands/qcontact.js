export default {
  name: 'QContact',
  command: ['qcontact', 'qc'],
  category: 'tools',
  description: 'Info dari quoted contact card (reply ke pesan kontak)',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, quoted }) {

    if (!quoted) {
      await sock.sendMessage(chat, {
        text: 'Reply ke sebuah pesan kontak dulu.\n\nCara: kirim kontak ke chat, lalu reply pesan kontak tersebut dan ketik qcontact',
      }, { quoted: m })
      return
    }

    const qmsg = quoted.message

    let contacts = []

    if (qmsg?.contactMessage) {
      contacts = [qmsg.contactMessage]
    } else if (qmsg?.contactsArrayMessage?.contacts?.length) {
      contacts = qmsg.contactsArrayMessage.contacts
    } else {
      await sock.sendMessage(chat, {
        text: 'Pesan yang di-reply bukan pesan kontak.\n\nReply ke pesan kontak (contact card) lalu ketik qcontact',
      }, { quoted: m })
      return
    }

    const results = []

    for (const contact of contacts) {
      const name  = contact.displayName || 'Unknown'
      const vcard = contact.vcard || ''
      const lines = vcard.split('\n').map(l => l.trim()).filter(Boolean)

      const get = (prefix) => {
        const l = lines.find(x => x.startsWith(prefix))
        return l ? l.slice(prefix.length).trim() : null
      }


      let phoneRaw = null
      const telLine = lines.find(l => l.startsWith('TEL'))
      if (telLine) {
 
        const waidMatch = telLine.match(/waid=([0-9]+)/)
        if (waidMatch) {
          phoneRaw = waidMatch[1]
        } else {

          phoneRaw = telLine.split(':').pop().replace(/[^0-9]/g, '')
        }
      }

      const jid   = phoneRaw ? `${phoneRaw}@s.whatsapp.net` : null
      const fn    = get('FN:')
      const org   = get('ORG:')
      const email = get('EMAIL:') || get('EMAIL;')
      const url   = get('URL:')
      const note  = get('NOTE:')
      const bday  = get('BDAY:')

      const block = [
        `*Nama     :* ${fn || name}`,
        phoneRaw ? `*Nomor    :* +${phoneRaw}` : null,
        jid ? `*JID      :* ${jid}` : null,
        org   ? `*Org      :* ${org}`   : null,
        email ? `*Email    :* ${email}` : null,
        url   ? `*URL      :* ${url}`   : null,
        bday  ? `*Birthday :* ${bday}`  : null,
        note  ? `*Note     :* ${note}`  : null,
      ].filter(Boolean).join('\n')

      results.push(block)
    }

    const text = [
      `*[ QUOTED CONTACT ]*`,
      `Total: ${contacts.length} kontak`,
      ``,
      results.join('\n\n─────────────\n\n'),
    ].join('\n')

    await sock.sendMessage(chat, { text }, { quoted: m })
  },
}
