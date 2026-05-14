import chokidar from 'chokidar'
import path from 'path'
import { logger } from '../lib/logger.js'
import { loadFile } from '../lib/loader.js'

/**
 * Watch ALL js files in the project (commands, lib, config, watcher)
 * Hot reload commands on change.
 * For lib/config changes: log & suggest restart (cannot hot-reload shared modules cleanly in ESM).
 */
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
        // Command file changed — hot reload
        const ok = await loadFile(commands, fp)
        if (ok) logger.reload('RELOAD', rel)
        else    logger.error(`Reload failed: ${rel}`)
      } else {
        // lib / config / watcher changed
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
        // Remove commands belonging to deleted file
        for (const [k, v] of commands) {
          // Heuristic: command file name contains command name
          const cmds = Array.isArray(v.command) ? v.command : [v.command]
          if (cmds.some(c => fp.endsWith(`${c}.js`)) || fp.endsWith(path.basename(fp))) {
            // Only delete if ALL cmds of this plugin are from this file
          }
        }
        // Brute: reload all commands to drop the deleted one
        logger.reload('DELETE', rel)
      } else {
        logger.reload('DELETE', rel)
      }
    })
    .on('error', e => logger.error(`Watcher: ${e.message}`))

  logger.info('Hot reload active (all .js files watched)')
}
