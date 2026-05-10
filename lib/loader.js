import { readdir, watch } from 'fs/promises'
import { pathToFileURL } from 'url'
import path from 'path'
import { logger } from './logger.js'

export async function loadCommands(dir) {
  const commands = new Map()
  let files
  try { files = await readdir(dir) } catch { return commands }
  const jsFiles = files.filter(f => f.endsWith('.js'))

  for (const file of jsFiles) {
    await loadFile(commands, path.resolve(dir, file))
  }
  return commands
}

export async function loadFile(commands, filePath) {
  try {
    const url = pathToFileURL(filePath).href + `?t=${Date.now()}`
    const mod  = await import(url)
    const plugin = mod.default
    if (!plugin?.command) { logger.warn(`Skip ${path.basename(filePath)}: no command`); return false }
    const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
    for (const c of cmds) commands.set(c.toLowerCase(), plugin)
    logger.plugin(path.basename(filePath))
    return true
  } catch (e) {
    logger.error(`Load ${path.basename(filePath)}: ${e.message}`)
    return false
  }
}

export function unloadFile(commands, filePath) {
  const name = path.basename(filePath)
  for (const [k, v] of commands) {
    const cmds = Array.isArray(v.command) ? v.command : [v.command]
   if (v._file === filePath || v._file === name) commands.delete(k)
  }
}
