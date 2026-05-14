import axios from 'axios'
import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'

const CATALOG_PHONE = '62895406178006'
const LUMI_BASE = 'https://lumi-html-preview.vercel.app'

async function uploadToLumi(htmlCode) {
  const response = await axios.post(
    `${LUMI_BASE}/api/create`,
    { html: htmlCode },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  )

  const data = response.data
  if (!data.success) throw new Error('Lumi upload gagal: ' + data.error)

  return {
    url: data.data.url,
    code: data.data.code,
    expiresAt: data.data.expires_at,
  }
}

async function getScreenshot(targetUrl) {
  const params = new URLSearchParams({
    url: targetUrl,
    meta: false,
    'screenshot.type': 'png',
    'screenshot.fullPage': false,
    'viewport.width': 1920,
    'viewport.height': 1080,
    adblock: true,
    force: false,
  })

  const apiUrl = `https://api.microlink.io/?${params.toString()}`
  const response = await axios.get(apiUrl, { timeout: 30000 })
  const data = response.data

  if (data.status === 'success') {
    return {
      screenshotUrl: data.data.screenshot.url,
      previewUrl: data.data.url,
      size: data.data.screenshot.size_pretty,
      width: data.data.screenshot.width,
      height: data.data.screenshot.height,
    }
  }

  throw new Error('Screenshot gagal: ' + data.status)
}

async function sendWebview(sock, chat, imgBuffer, caption, screenshotUrl, lumiUrl) {
  const media = await prepareWAMessageMedia(
    { image: imgBuffer },
    { upload: sock.waUploadToServer }
  )

  const quotedContact = {
    key: {
      remoteJid: '0@s.whatsapp.net',
      fromMe: false,
      id: 'LUMI_WEBVIEW',
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
        header: {
          hasMediaAttachment: true,
          imageMessage: media.imageMessage,
        },
        body: { text: caption },
        footer: { text: 'Lumi Hevia | Webview' },
        nativeFlowMessage: {
          messageParamsJson: JSON.stringify({
            bottom_sheet: {
              in_thread_buttons_limit: 2,
              divider_indices: [0, 1],
              list_title: 'Webview',
              button_title: 'Options',
            },
            tap_target_configuration: {
              title: 'Webview Result',
              description: 'HTML Preview',
              canonical_url: `https://wa.me/${CATALOG_PHONE}`,
              domain: `https://wa.me/${CATALOG_PHONE}`,
              button_index: 0,
            },
          }),
          buttons: [
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'Buka Preview',
                url: lumiUrl,
                merchant_url: lumiUrl,
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
  command: ['webview'],
  category: 'tools',
  description: 'Render HTML code dan kirim screenshot + catalog button',
  ownerOnly: false,
  cooldown: 15000,

  async execute({ sock, m, chat, body }) {
    const htmlCode = body.replace(/^webview\s*/i, '').trim()

    if (!htmlCode) {
      await sock.sendMessage(
        chat,
        { text: 'Usage: webview <html code>\nContoh: webview <!DOCTYPE html><html><body><h1>Hello</h1></body></html>' },
        { quoted: m }
      )
      return
    }

    if (!htmlCode.toLowerCase().startsWith('<!doctype html')) {
      await sock.sendMessage(
        chat,
        { text: 'HTML harus diawali dengan <!DOCTYPE html>' },
        { quoted: m }
      )
      return
    }

    await sock.sendMessage(chat, { text: 'Memproses webview, harap tunggu...' }, { quoted: m })

    try {
      const preview = await uploadToLumi(htmlCode)
      const screenshot = await getScreenshot(preview.url)

      const imgResponse = await axios.get(screenshot.screenshotUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
      })

      const imgBuffer = Buffer.from(imgResponse.data)

      const caption = [
        '*Webview Result*',
        '',
        `Size   : ${screenshot.size}`,
        `Width  : ${screenshot.width}px`,
        `Height : ${screenshot.height}px`,
        `Code   : ${preview.code}`,
      ].join('\n')

      await sendWebview(sock, chat, imgBuffer, caption, screenshot.screenshotUrl, preview.url)
    } catch (e) {
      await sock.sendMessage(
        chat,
        { text: `Webview error: ${e.message}` },
        { quoted: m }
      )
    }
  },
}