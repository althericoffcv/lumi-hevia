import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const relay = async (sock, chat, m, payload) => {
  const msg = generateWAMessageFromContent(chat, payload, { quoted: m })
  await sock.relayMessage(msg.key.remoteJid, msg.message, {
    messageId: msg.key.id,
    additionalNodes: [{
      tag: 'biz', attrs: {},
      content: [{
        tag: 'interactive', attrs: { type: 'native_flow', v: '1' },
        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
      }],
    }],
  })
  return msg
}

const iMsg = (body, footer, buttons, headerOpts = {}) => ({
  interactiveMessage: {
    header: { hasMediaAttachment: false, title: 'Button Test', ...headerOpts },
    body: { text: body },
    footer: { text: footer },
    nativeFlowMessage: { messageParamsJson: '', buttons },
  },
})

export default {
  name: 'Button',
  command: ['button', 'btn'],
  category: 'general',
  description: 'Test semua button type Baileys v7 RC10',
  ownerOnly: false,
  cooldown: 10000,

  async execute({ sock, m, chat }) {
    const delay = (ms) => new Promise(r => setTimeout(r, ms))

    // 1. single_select
    await relay(sock, chat, m, iMsg(
      'single_select\nDropdown list pilihan menu.',
      'type: single_select',
      [{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: 'Pilih Opsi',
          sections: [{
            title: 'Test Options',
            highlight_label: 'Test',
            rows: [
              { header: 'a', title: 'Option A', description: 'Deskripsi A', id: 'sel_a' },
              { header: 'b', title: 'Option B', description: 'Deskripsi B', id: 'sel_b' },
              { header: 'c', title: 'Option C', description: 'Deskripsi C', id: 'sel_c' },
            ],
          }],
        }),
      }]
    ))
    await delay(400)

    // 2. quick_reply
    await relay(sock, chat, m, iMsg(
      'quick_reply\nTap button untuk auto-reply dengan ID.',
      'type: quick_reply',
      [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Reply A', id: 'qr_a' }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Reply B', id: 'qr_b' }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Reply C', id: 'qr_c' }) },
      ]
    ))
    await delay(400)

    // 3. cta_url
    await relay(sock, chat, m, iMsg(
      'cta_url\nBuka URL di browser atau WA.',
      'type: cta_url',
      [
        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'GitHub', url: 'https://github.com', merchant_url: 'https://github.com' }) },
        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Google', url: 'https://google.com', merchant_url: 'https://google.com' }) },
        { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'WA Link (webview)', url: 'https://wa.me/628xxxxxxxxxx', merchant_url: 'https://wa.me/628xxxxxxxxxx', webview_interaction: true }) },
      ]
    ))
    await delay(400)

    // 4. cta_copy
    await relay(sock, chat, m, iMsg(
      'cta_copy\nTap untuk copy teks ke clipboard.',
      'type: cta_copy',
      [
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Token', copy_code: 'LUMIHEVIA-2025', id: 'copy_1' }) },
        { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Code',  copy_code: 'ABC123XYZ',       id: 'copy_2' }) },
      ]
    ))
    await delay(400)

    // 5. cta_call
    await relay(sock, chat, m, iMsg(
      'cta_call\nTap untuk langsung menelepon nomor.',
      'type: cta_call',
      [{ name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: 'Call Owner', phone_number: '+6281234567890', id: 'call_1' }) }]
    ))
    await delay(400)

    // 6. send_location
    await relay(sock, chat, m, iMsg(
      'send_location\nTap untuk kirim lokasi kamu ke chat.',
      'type: send_location',
      [{ name: 'send_location', buttonParamsJson: '' }]
    ))
    await delay(400)

    // 7. address_message
    await relay(sock, chat, m, iMsg(
      'address_message\nMinta user mengirimkan alamat mereka.',
      'type: address_message',
      [{ name: 'address_message', buttonParamsJson: JSON.stringify({ display_text: 'Kirim Alamat', id: 'addr_1' }) }]
    ))
    await delay(400)

    // 8. cta_reminder + cta_cancel_reminder
    await relay(sock, chat, m, iMsg(
      'cta_reminder + cta_cancel_reminder\nSet atau cancel reminder.',
      'type: cta_reminder / cta_cancel_reminder',
      [
        { name: 'cta_reminder',        buttonParamsJson: JSON.stringify({ display_text: 'Set Reminder',    id: 'rem_1' }) },
        { name: 'cta_cancel_reminder', buttonParamsJson: JSON.stringify({ display_text: 'Cancel Reminder', id: 'rem_1' }) },
      ]
    ))
    await delay(400)

    // 9. flow
    await relay(sock, chat, m, iMsg(
      'flow\nMembuka WA Flow — form interaktif multi-step.',
      'type: flow',
      [{ name: 'flow', buttonParamsJson: JSON.stringify({ flow_token: 'test_token', flow_id: 'test_flow_id', flow_cta: 'Open Flow', flow_action: 'navigate', flow_action_payload: { screen: 'WELCOME' } }) }]
    ))
    await delay(400)

    // 10. open_webview
    await relay(sock, chat, m, iMsg(
      'open_webview\nBuka URL di dalam webview WA.',
      'type: open_webview',
      [{ name: 'open_webview', buttonParamsJson: JSON.stringify({ url: 'https://github.com', display_text: 'Open Webview' }) }]
    ))
    await delay(400)

    // 11. cta_catalog
    await relay(sock, chat, m, iMsg(
      'cta_catalog\nBuka katalog bisnis.',
      'type: cta_catalog',
      [{ name: 'cta_catalog', buttonParamsJson: JSON.stringify({ display_text: 'Lihat Katalog', biz_jid: chat }) }]
    ))
    await delay(400)

    // 12. mpm (multi-product message)
    await relay(sock, chat, m, iMsg(
      'mpm\nMulti Product Message — tampilkan beberapa produk.',
      'type: mpm',
      [{ name: 'mpm', buttonParamsJson: JSON.stringify({ biz_jid: chat, product_list: [] }) }]
    ))
    await delay(400)

    // 13. review_order
    await relay(sock, chat, m, iMsg(
      'review_order\nTampilkan review order ke user.',
      'type: review_order',
      [{ name: 'review_order', buttonParamsJson: JSON.stringify({ order_id: 'order_test_001', display_text: 'Review Order' }) }]
    ))
    await delay(400)

    // 14. payment_info
    await relay(sock, chat, m, iMsg(
      'payment_info\nTampilkan info pembayaran.',
      'type: payment_info',
      [{ name: 'payment_info', buttonParamsJson: JSON.stringify({ amount: '50000', currency: 'IDR', display_text: 'Info Pembayaran' }) }]
    ))
    await delay(400)

    // 15. wa_payment_transaction_details
    await relay(sock, chat, m, iMsg(
      'wa_payment_transaction_details\nDetail transaksi WA Pay.',
      'type: wa_payment_transaction_details',
      [{ name: 'wa_payment_transaction_details', buttonParamsJson: JSON.stringify({ transaction_id: 'txn_test_001', display_text: 'Lihat Transaksi' }) }]
    ))
    await delay(400)

    // 16. galaxy_message
    await relay(sock, chat, m, iMsg(
      'galaxy_message\nGalaxy/AI message dari Meta AI.',
      'type: galaxy_message',
      [{ name: 'galaxy_message', buttonParamsJson: JSON.stringify({ display_text: 'Galaxy Message', id: 'galaxy_1' }) }]
    ))
    await delay(400)

    // 17. automated_greeting_message_view_catalog
    await relay(sock, chat, m, iMsg(
      'automated_greeting_message_view_catalog\nGreeting otomatis dengan link katalog.',
      'type: automated_greeting_message_view_catalog',
      [{ name: 'automated_greeting_message_view_catalog', buttonParamsJson: JSON.stringify({ display_text: 'Lihat Katalog', biz_jid: chat }) }]
    ))
    await delay(400)

    // 18. ALL IN 0N33
    await relay(sock, chat, m, iMsg(
      'ALL IN ONE\nKombinasi: single_select + quick_reply + cta_url + cta_copy + cta_call + send_location',
      'type: mixed | Lumi Hevia',
      [
        { name: 'single_select', buttonParamsJson: JSON.stringify({ title: 'Pilih', sections: [{ title: 'Menu', rows: [{ header: 'menu', title: 'menu', description: 'Ke menu utama', id: 'menu' }] }] }) },
        { name: 'quick_reply',   buttonParamsJson: JSON.stringify({ display_text: 'Ping', id: 'ping' }) },
        { name: 'cta_url',       buttonParamsJson: JSON.stringify({ display_text: 'GitHub', url: 'https://github.com', merchant_url: 'https://github.com' }) },
        { name: 'cta_copy',      buttonParamsJson: JSON.stringify({ display_text: 'Copy', copy_code: 'MIXED-TEST', id: 'mix_copy' }) },
        { name: 'cta_call',      buttonParamsJson: JSON.stringify({ display_text: 'Call', phone_number: '+6281234567890', id: 'mix_call' }) },
        { name: 'send_location', buttonParamsJson: '' },
      ]
    ))
  },
}
