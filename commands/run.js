import util from 'util'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

export default {
  name: 'Run',
  command: ['run'],
  category: 'developer',
  description: 'Eksekusi JS code / relay payload WA dari quoted .js file (owner only)',
  ownerOnly: true,
  cooldown: 500,

  async execute({ sock, m, chat, sender, quoted, message, body, startTime }) {
    const conn = sock
    const jid  = chat

    const inlineCode = body.replace(/^run\s*/i, '').trim()

    if (inlineCode) {
      await _exec(sock, m, chat, jid, quoted, inlineCode)
      return
    }

    if (!quoted) {
      await sock.sendMessage(chat, {
        text: [
          `*[ RUN ]*`,
          ``,
          `1. Inline: run <code>`,
          `   run await sock.sendMessage(jid, { text: "test" })`,
          ``,
          `2. Reply file .js dari CRM lalu ketik: run`,
        ].join('\n'),
      }, { quoted: m })
      return
    }

    const qmsg   = quoted.message
    const docMsg = qmsg?.documentMessage

    if (!docMsg) {
      await sock.sendMessage(chat, { text: 'Reply ke file .js dari CRM.' }, { quoted: m })
      return
    }

    if (!docMsg.fileName?.endsWith('.js') && docMsg.mimetype !== 'application/javascript') {
      await sock.sendMessage(chat, { text: 'File harus .js' }, { quoted: m })
      return
    }

    let code
    try {
      const buf = await downloadMediaMessage(
        { key: quoted.key, message: qmsg },
        'buffer',
        {},
        {
          logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} },
          reuploadRequest: sock.updateMediaMessage,
        }
      )
      code = buf.toString('utf-8')
    } catch (e) {
      await sock.sendMessage(chat, { text: `Gagal download: ${e.message}` }, { quoted: m })
      return
    }

    // Strip comment header yang di-generate CRM
    code = code
      .split('\n')
      .filter(l => !l.startsWith('// Generated') && !l.startsWith('// Type:') && !l.startsWith('// Cara'))
      .join('\n')
      .trim()

    await _exec(sock, m, chat, jid, quoted, code)
  },
}

async function _exec(sock, m, chat, jid, quoted, code) {
  const conn = sock
  const t0   = Date.now()

  // Fungsi revive buffer — dipakai di dalam eval scope
  function reviveBuffers(obj) {
    if (obj && typeof obj === 'object') {
      if (obj.type === 'Buffer' && Array.isArray(obj.data)) return Buffer.from(obj.data)
      for (const k in obj) obj[k] = reviveBuffers(obj[k])
    }
    return obj
  }

  let result
  let isError = false

  try {
    // Expose semua vars ke scope — pakai Function constructor agar tidak
    // double-wrap dan scope lebih bersih dari IIFE
    const fn = new Function(
      'sock', 'conn', 'jid', 'chat', 'm', 'quoted', 'reviveBuffers', 'Buffer',
      `return (async () => { ${code} })()`
    )
    result = await fn(sock, sock, jid, chat, m, quoted, reviveBuffers, Buffer)
  } catch (e) {
    result  = e
    isError = true
  }

  const elapsed = `${Date.now() - t0} ms`

  let output
  if (isError) {
    output = `${result.name}: ${result.message}\n${result.stack?.split('\n').slice(0,5).join('\n') || ''}`
  } else if (result === undefined || result === null) {
    output = String(result)
  } else if (typeof result === 'object') {
    output = util.inspect(result, { depth: 3, colors: false, compact: true })
  } else {
    output = String(result)
  }

  if (output.length > 2000) output = output.slice(0, 2000) + '\n...(truncated)'

  await sock.sendMessage(chat, {
    text: [
      `*[ RUN — ${isError ? 'ERROR' : 'OK'} ]*`,
      ``,
      `*Code:*`,
      '```' + code.slice(0, 400) + (code.length > 400 ? '\n...' : '') + '```',
      ``,
      `*Result:*`,
      '```' + output + '```',
      ``,
      `Elapsed: ${elapsed}`,
    ].join('\n'),
  }, { quoted: m })
}
