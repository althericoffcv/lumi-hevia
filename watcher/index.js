import chokidar from 'chokidar'
import path from 'path'
import { logger } from '../lib/logger.js'
import { loadFile } from '../lib/loader.js'

export function startWatcher(rootDir, commandsDir, commands) {
  const watcher = chokidar.watch(rootDir, {
    persistent: true,
    ignoreInitial: true,
    ignored: /(node_modules|session|\.git)/,
    awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
  })

  watcher
    .on('change', async (fp) => {
      const name = path.basename(fp)
      const rel  = fp.replace(rootDir + path.sep, '')
      if (fp.startsWith(commandsDir)) {
        const ok = await loadFile(commands, fp)
        if (ok) logger.reload('RELOAD', rel)
        else    logger.error(`Reload failed: ${rel}`)
      } else {
        logger.reload('RELOAD', rel)
        logger.warn('Core file changed — restart recommended for full effect')
      }
    })
    .on('add', async (fp) => {
      if (!fp.endsWith('.js')) return
      const name = path.basename(fp)
      const rel  = fp.replace(rootDir + path.sep, '')

      if (fp.startsWith(commandsDir)) {
        const ok = await loadFile(commands, fp)
        if (ok) logger.reload('NEW FILE', rel)
      } else {
        logger.reload('NEW FILE', rel)
      }
    })
    .on('unlink', (fp) => {
      const rel  = fp.replace(rootDir + path.sep, '')
      if (fp.startsWith(commandsDir)) {
        for (const [k, v] of commands) {
          const cmds = Array.isArray(v.command) ? v.command : [v.command]
          if (cmds.some(c => fp.endsWith(`${c}.js`)) || fp.endsWith(path.basename(fp))) {
          }
        }
        logger.reload('DELETE', rel)
      } else {
        logger.reload('DELETE', rel)
      }
    })
    .on('error', e => logger.error(`Watcher: ${e.message}`))

  logger.info('Hot reload active (all .js files watched)')
}
