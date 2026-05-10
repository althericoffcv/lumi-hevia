import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import chalk from 'chalk'
import path from 'path'
import { fileURLToPath } from 'url'

import { logger }          from './lib/logger.js'
import { loadCommands }    from './lib/loader.js'
import { messageHandler }  from './lib/handler.js'
import { startWatcher }    from './watcher/index.js'
import { config }          from './config/index.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SESSION    = path.resolve(__dirname, 'session')
const COMMANDS   = path.resolve(__dirname, 'commands')
const ROOT       = __dirname

const silent   = pino({ level: 'silent' })
const startTime = Date.now()
let commands    = new Map()

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION)
  const { version }          = await fetchLatestBaileysVersion()

  logger.info(`Baileys ${version.join('.')}`)

  const sock = makeWASocket({
    version,
    logger: silent,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, silent),
    },
    printQRInTerminal:          false,
    generateHighQualityLinkPreview: false,
    syncFullHistory:            false,
    markOnlineOnConnect:        true,
    keepAliveIntervalMs:        10_000,
    retryRequestDelayMs:        250,
  })

  if (!sock.authState.creds.registered) {
    logger.info('Belum ada sesi. Masukkan nomor WA untuk pairing code.')
    const { createInterface } = await import('readline')
    const rl    = createInterface({ input: process.stdin, output: process.stdout })
    const phone = await new Promise(r =>
      rl.question(chalk.yellow('  Nomor (contoh 628xxx): '), a => { rl.close(); r(a.replace(/[^0-9]/g, '')) })
    )
    await new Promise(r => setTimeout(r, 1500))
    const code = await sock.requestPairingCode(phone)
    logger.pairing(code)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'connecting') logger.info('Connecting...')

    if (connection === 'open') {
      logger.success(`Connected | ${config.botName} v${config.version}`)
      logger.success(`Commands loaded: ${commands.size}`)

      const me = sock.authState.creds.me
      if (me?.id)  logger.info(`JID : ${me.id}`)
      if (me?.lid) logger.info(`LID : ${me.lid}`)
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      logger.warn(`Connection closed: ${code}`)

      const fatal = [
        DisconnectReason.badSession,
        DisconnectReason.connectionReplaced,
        DisconnectReason.loggedOut,
      ]

      if (fatal.includes(code)) {
        logger.error('Fatal. Hapus folder session dan restart.')
        process.exit(1)
      }

      const delay = code === DisconnectReason.timedOut ? 5000 : 3000
      logger.info(`Reconnect dalam ${delay / 1000}s...`)
      setTimeout(connect, delay)
    }
  })

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      if (!m.message) continue
      messageHandler(sock, m, commands, startTime).catch(e => logger.error(`MSG: ${e.message}`))
    }
  })

  return sock
}

async function main() {
  console.clear()
  logger.banner()

  logger.info('Loading commands...')
  commands = await loadCommands(COMMANDS)
  logger.success(`Loaded ${commands.size} commands`)

  startWatcher(ROOT, COMMANDS, commands)

  await connect()
}

process.on('uncaughtException',  e => logger.error(`Uncaught: ${e.message}`))
process.on('unhandledRejection', e => logger.error(`Unhandled: ${e}`))

main()
