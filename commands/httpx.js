import axios from 'axios'
import * as cheerio from 'cheerio'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync, rmSync, mkdirSync } from 'fs'
import path from 'path'
import os from 'os'
import { randomBytes } from 'crypto'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

function resolveUrl(base, rel) {
  try { return new URL(rel, base).href } catch { return null }
}

function safeName(url, ext = '.bin') {
  try {
    const name = path.basename(new URL(url).pathname)
    return name.includes('.') ? name : name + ext
  } catch { return `file_${Date.now()}${ext}` }
}

async function fetchAsset(url) {
  try {
    const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000, headers: { 'User-Agent': UA }, maxRedirects: 5 })
    return Buffer.from(r.data)
  } catch { return null }
}

export default {
  name: 'HTTPX',
  command: ['httpx'],
  category: 'tools',
  description: 'Download website source + assets as ZIP',
  ownerOnly: false,
  cooldown: 15000,

  async execute({ sock, m, chat, args }) {
    const url = args[0]
    if (!url?.startsWith('http')) {
      await sock.sendMessage(chat, { text: 'Usage: httpx <url>\nExample: httpx https://example.com' }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, { text: `Fetching ${url} ...` }, { quoted: m })

    const id = randomBytes(6).toString('hex')
    const tmpDir = path.join(os.tmpdir(), `httpx_${id}`)
    const zipPath = path.join(os.tmpdir(), `httpx_${id}.zip`)

    try {
      mkdirSync(tmpDir, { recursive: true })
      await mkdir(path.join(tmpDir, 'assets'), { recursive: true })

      const res = await axios.get(url, { timeout: 12000, headers: { 'User-Agent': UA }, maxRedirects: 5 })
      const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      await writeFile(path.join(tmpDir, 'index.html'), html, 'utf8')

      const $ = cheerio.load(html)
      const assetSet = new Set()

      $('link[href]').each((_, el) => { const r = resolveUrl(url, $(el).attr('href')); if (r) assetSet.add(r) })
      $('script[src]').each((_, el) => { const r = resolveUrl(url, $(el).attr('src')); if (r) assetSet.add(r) })
      $('img[src]').each((_, el) => { const r = resolveUrl(url, $(el).attr('src')); if (r) assetSet.add(r) })
      $('source[src]').each((_, el) => { const r = resolveUrl(url, $(el).attr('src')); if (r) assetSet.add(r) })

      const assets = [...assetSet].slice(0, 50)
      const downloaded = []

      for (const assetUrl of assets) {
        const buf = await fetchAsset(assetUrl)
        if (buf) {
          const fname = safeName(assetUrl)
          await writeFile(path.join(tmpDir, 'assets', fname), buf)
          downloaded.push({ url: assetUrl, file: `assets/${fname}`, size: buf.length })
        }
      }

      await writeFile(
        path.join(tmpDir, 'manifest.json'),
        JSON.stringify({ url, fetched: new Date().toISOString(), assets: downloaded }, null, 2),
        'utf8'
      )

      await new Promise((res, rej) => {
        const out = createWriteStream(zipPath)
        const arc = archiver('zip', { zlib: { level: 6 } })
        out.on('close', res)
        arc.on('error', rej)
        arc.pipe(out)
        arc.directory(tmpDir, false)
        arc.finalize()
      })

      const zipBuf = await readFile(zipPath)
      const domain = new URL(url).hostname.replace(/\./g, '_')

      await sock.sendMessage(
        chat,
        {
          document: zipBuf,
          mimetype: 'application/zip',
          fileName: `${domain}.zip`,
          caption: [
            `*HTTPX Result*`,
            `URL    : ${url}`,
            `Assets : ${downloaded.length} files`,
            `Size   : ${(zipBuf.length / 1024).toFixed(1)} KB`,
          ].join('\n'),
        },
        { quoted: m }
      )
    } catch (e) {
      await sock.sendMessage(chat, { text: `HTTPX error: ${e.message}` }, { quoted: m })
    } finally {
      try { if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      try { if (existsSync(zipPath)) rmSync(zipPath, { force: true }) } catch {}
    }
  },
}
