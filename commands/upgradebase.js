import axios from 'axios'
import { readdir, readFile, stat } from 'fs/promises'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config/index.js'
import { makeAdReply } from '../lib/externalAdReply.js'

const ROOT    = join(fileURLToPath(import.meta.url), '..', '..')
const EXCLUDE = ['node_modules', 'session', '.git', 'tmp']

async function getAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files   = []
  for (const e of entries) {
    if (EXCLUDE.includes(e.name)) continue
    const fp = join(dir, e.name)
    if (e.isDirectory()) files.push(...await getAllFiles(fp))
    else files.push({ full: fp, rel: relative(ROOT, fp) })
  }
  return files
}

export default {
  name: 'UpgradeBase',
  command: ['upgradebase'],
  category: 'developer',
  description: 'Upload semua file lokal ke GitHub repo (replace)',
  ownerOnly: true,
  cooldown: 60000,

  async execute({ sock, m, chat }) {
    if (!config.tokengithub || !config.usernamegithub || !config.repobase) {
      await sock.sendMessage(chat, { text: 'Set config.tokengithub, usernamegithub, repobase dulu.' }, { quoted: m })
      return
    }

    await sock.sendMessage(chat, { text: 'Uploading files ke GitHub...' }, { quoted: m })

    const headers = {
      Authorization: `token ${config.tokengithub}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }

    const BASE = `https://api.github.com/repos/${config.usernamegithub}/${config.repobase}/contents`

    async function getSha(path) {
      try {
        const res = await axios.get(`${BASE}/${path}`, { headers })
        return res.data.sha
      } catch { return null }
    }

    const files   = await getAllFiles(ROOT)
    let uploaded  = 0
    let failed    = 0

    for (const { full, rel } of files) {
      try {
        const content = (await readFile(full)).toString('base64')
        const sha     = await getSha(rel)
        const body    = { message: `upgrade: ${rel}`, content }
        if (sha) body.sha = sha
        await axios.put(`${BASE}/${rel}`, body, { headers })
        uploaded++
      } catch { failed++ }
    }

    await sock.sendMessage(chat, {
      text: `Upgrade selesai.\nUploaded: ${uploaded}\nFailed: ${failed}`,
      contextInfo: makeAdReply('Upgrade Base', `${uploaded} files uploaded`),
    }, { quoted: m })
  },
}
