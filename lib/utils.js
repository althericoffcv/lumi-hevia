import os from 'os'
import moment from 'moment-timezone'
import { config } from '../config/index.js'
import { isLidUser, jidNormalizedUser } from '@whiskeysockets/baileys'

export function getRuntime(startTime) {
  const s = Math.floor((Date.now() - startTime) / 1000)
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24)
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

export function getRAM() {
  return `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`
}

export function getCPU() {
  const cpu = os.cpus()[0]
  const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
  return `${(((total - cpu.times.idle) / total) * 100).toFixed(1)}%`
}

export function getImageQuery() {
  const h = moment().tz(config.timezone).hour()
  if (h >= 4 && h < 11) return 'Morning+Aesthetic+16:9'
  if (h >= 11 && h < 18) return 'Aesthetic+16:9'
  return 'Aesthetic+Night+16:9'
}

export function getGreeting() {
  const h = moment().tz(config.timezone).hour()
  if (h >= 4 && h < 11) return '𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗣𝗮𝗴𝗶'
  if (h >= 11 && h < 15) return '𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗶𝗮𝗻𝗴'
  if (h >= 15 && h < 18) return '𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗦𝗼𝗿𝗲'
  return '𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗠𝗮𝗹𝗮𝗺'
}

/**
 * Resolve JID/LID ke phone number (JID standar @s.whatsapp.net)
 * Di Baileys v7, sender bisa berformat @lid — harus di-resolve ke PN dulu
 * @param {string} jid
 * @param {object} sock - sock instance dengan signalRepository.lidMapping
 * @returns {Promise<string>} JID standar
 */
export async function resolveJID(jid, sock) {
  if (!jid) return ''
  const normalized = jidNormalizedUser(jid)
  if (isLidUser(normalized)) {
    try {
      const pn = await sock.signalRepository.lidMapping.getPNForLID(normalized)
      if (pn) return jidNormalizedUser(pn)
    } catch {}
  }
  return normalized
}

/**
 * Resolve JID ke LID
 * @param {string} jid - phone JID (@s.whatsapp.net)
 * @param {object} sock
 * @returns {Promise<string|null>}
 */
export async function resolveLID(jid, sock) {
  if (!jid) return null
  const normalized = jidNormalizedUser(jid)
  if (isLidUser(normalized)) return normalized
  try {
    const lid = await sock.signalRepository.lidMapping.getLIDForPN(normalized)
    return lid ? jidNormalizedUser(lid) : null
  } catch { return null }
}

/**
 * Check owner — support LID sender
 * @param {string} jid - sender jid (bisa @lid atau @s.whatsapp.net)
 * @param {object} sock
 * @returns {Promise<boolean>}
 */
export async function checkOwner(jid, sock) {
  const resolved = await resolveJID(jid, sock)
  const num = resolved.replace(/[^0-9]/g, '')
  return config.ownerNumber.some(o => o.replace(/[^0-9]/g, '') === num)
}
