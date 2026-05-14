import { AIRich, Button } from '../lib/builder.js'
import { getRuntime } from '../lib/utils.js'

export default {
  name: 'Table',
  command: ['table', 'tabel'],
  category: 'general',
  description: 'Menampilkan foto dan tabel informasi bot',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, startTime, sender, pushname }) {
    const runtime = getRuntime(startTime)
    
    // Data tabel
    const tableData = [
      ['Item', 'Value'],
      ['🤖 Bot Name', 'Lumi Hevia'],
      ['👤 Author', 'Bayu Official'],
      ['📦 Version', 'Alpha'],
      ['⏱️ Runtime', runtime],
      ['✅ Status', 'Active'],
      ['⚙️ Platform', 'Baileys']
    ]

    // URL foto yang mau ditampilin
    const imageUrl = 'https://ik.imagekit.io/bayuofficial/20260507_185602.jpg?updatedAt=1778157404581'

    // Buat AIRich dengan foto + tabel
    const rich = new AIRich()
      .addImage(imageUrl)  // Tambah foto dulu
      .addText(`📊 *INFORMASI BOT LUMI HEVIA*\n\nHalo ${pushname || m.pushName || 'User'}!`) // Teks
      .addTable(tableData) // Tabel

    // Kirim rich message
    await rich.run(chat, sock, { quoted: m })

    // Tambah button untuk aksi
    const menu = new Button()
      .setBody('Pilih aksi selanjutnya:')
      .setFooter('Lumi Hevia Bot')
      .addReply('🔄 Refresh', 'table')
      .addReply('🔙 Kembali ke Menu', 'menu2')

    await menu.run(chat, sock, m)
  }
}