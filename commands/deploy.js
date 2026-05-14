import axios from 'axios'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { config } from '../config/index.js'
import { makeAdReply } from '../lib/externalAdReply.js'

export default {
  name: 'Deploy',
  command: ['deploy'],
  category: 'developer',
  description: 'Deploy project ke Vercel',
  ownerOnly: true,
  cooldown: 30000,

  async execute({ sock, m, chat, args, quoted }) {
    const projectName = args[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    if (!projectName) {
      await sock.sendMessage(chat, { text: 'Usage: deploy <project-name>\nReply dokumen file atau GitHub repo URL.' }, { quoted: m })
      return
    }

    if (!config.tokenvercel) {
      await sock.sendMessage(chat, { text: 'Set config.tokenvercel dulu.' }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, { text: `Deploying ${projectName} ke Vercel...` }, { quoted: m })

    const headers = {
      Authorization: `Bearer ${config.tokenvercel}`,
      'Content-Type': 'application/json',
    }

    try {
      let files = []

      if (quoted?.message?.documentMessage) {
        const buf  = await downloadMediaMessage(
          { key: quoted.key, message: quoted.message },
          'buffer', {},
          { logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} }, reuploadRequest: sock.updateMediaMessage }
        )
        const code = buf.toString('utf-8')
        const name = quoted.message.documentMessage.fileName || 'index.js'
        files = [{ file: name, data: code }]
      } else if (args[1]?.startsWith('https://github.com')) {
        const repoUrl = args[1]
        const parts   = repoUrl.replace('https://github.com/', '').split('/')
        const owner   = parts[0]
        const repo    = parts[1]
        const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`

        async function fetchGhFiles(path = '') {
          const res   = await axios.get(`${apiBase}/${path}`, {
            headers: { Authorization: `token ${config.tokengithub}` },
          })
          const result = []
          for (const item of res.data) {
            if (item.type === 'file') {
              const fc = await axios.get(item.download_url, { responseType: 'text' })
              result.push({ file: item.path, data: fc.data })
            } else if (item.type === 'dir') {
              result.push(...await fetchGhFiles(item.path))
            }
          }
          return result
        }
        files = await fetchGhFiles()
      } else {
        files = [{ file: 'index.html', data: '<h1>Deployed by Lumi Hevia</h1>' }]
      }

      const deployRes = await axios.post('https://api.vercel.com/v13/deployments', {
        name: projectName,
        files: files.map(f => ({ file: f.file, data: f.data })),
        projectSettings: { framework: null },
        target: 'production',
      }, { headers })

      const deploy = deployRes.data
      const url    = `https://${deploy.url || projectName + '.vercel.app'}`

      await sock.sendMessage(chat, {
        text: `Deploy berhasil!\nProject : ${projectName}\nURL     : ${url}\nID      : ${deploy.id}`,
        contextInfo: makeAdReply('Vercel Deploy', url, url),
      }, { quoted: m })
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message
      await sock.sendMessage(chat, { text: `Deploy error: ${msg}` }, { quoted: m })
    }
  },
}
