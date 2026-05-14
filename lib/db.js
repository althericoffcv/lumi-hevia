import axios from 'axios'
import { config } from '../config/index.js'

const BASE = `https://api.github.com/repos/${config.usernamegithub}/${config.repodb}/contents/database.json`
const HEADERS = () => ({
  Authorization: `token ${config.tokengithub}`,
  'Content-Type': 'application/json',
  Accept: 'application/vnd.github.v3+json',
})

let _cache = null
let _sha   = null

const DEFAULT = {
  groups: {},
  users: {},
  warns: {},
  afk: {},
  blacklist: [],
  settings: { publicMode: config.publicMode },
}

export async function getDB() {
  if (_cache) return _cache
  try {
    const res  = await axios.get(BASE, { headers: HEADERS() })
    _sha       = res.data.sha
    const raw  = Buffer.from(res.data.content, 'base64').toString('utf8')
    _cache     = JSON.parse(raw)
  } catch {
    _cache = JSON.parse(JSON.stringify(DEFAULT))
  }
  return _cache
}

export async function saveDB(data) {
  _cache = data
  if (!config.tokengithub || !config.usernamegithub) return
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
    const body    = { message: 'update db', content }
    if (_sha) body.sha = _sha
    const res = await axios.put(BASE, body, { headers: HEADERS() })
    _sha = res.data.content?.sha || _sha
  } catch {}
}

export async function getGroup(jid) {
  const db = await getDB()
  if (!db.groups[jid]) db.groups[jid] = {
    welcome: false, goodbye: false, antitoxic: false,
    antispam: false, antilink: false, antidel: false,
    antiviewonce: false, only62: false, open: true,
    welcomeMsg: '', goodbyeMsg: '',
    messages: {}, spamTrack: {},
    reminderList: [],
  }
  return db.groups[jid]
}

export async function saveGroup(jid, data) {
  const db = await getDB()
  db.groups[jid] = data
  await saveDB(db)
}

export async function getWarn(jid, gid) {
  const db  = await getDB()
  const key = `${gid}:${jid}`
  return db.warns[key] || 0
}

export async function setWarn(jid, gid, count) {
  const db  = await getDB()
  const key = `${gid}:${jid}`
  db.warns[key] = count
  await saveDB(db)
}

export async function getAfk(jid) {
  const db = await getDB()
  return db.afk[jid] || null
}

export async function setAfk(jid, reason) {
  const db = await getDB()
  if (reason === null) { delete db.afk[jid] }
  else db.afk[jid] = { reason, since: Date.now() }
  await saveDB(db)
}

export async function trackMessage(jid, gid) {
  const db  = await getDB()
  if (!db.groups[gid]) await getGroup(gid)
  if (!db.groups[gid].messages) db.groups[gid].messages = {}
  db.groups[gid].messages[jid] = (db.groups[gid].messages[jid] || 0) + 1
  _cache = db
}

export async function isBlacklisted(jid) {
  const db = await getDB()
  return (db.blacklist || []).includes(jid)
}

export async function addBlacklist(jid) {
  const db = await getDB()
  if (!db.blacklist) db.blacklist = []
  if (!db.blacklist.includes(jid)) { db.blacklist.push(jid); await saveDB(db) }
}

export function flushCache() { _cache = null; _sha = null }
