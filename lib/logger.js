import chalk from 'chalk'
import figlet from 'figlet'
import { config } from '../config/index.js'

const ts = () => chalk.gray(`[${new Date().toLocaleTimeString('id-ID', { hour12: false })}]`)

export const logger = {
  banner() {
    const art = figlet.textSync('LUMI HEVIA', { font: 'Small' })
    console.log(chalk.cyan(art))
    console.log(chalk.gray('  ') + chalk.white(`${config.botName} v${config.version}`) + chalk.gray(' | ') + chalk.dim(`by ${config.author}`))
    console.log(chalk.gray('  ' + '─'.repeat(50)))
    console.log()
  },
  info:    (m) => console.log(`${ts()} ${chalk.cyan('[*]')} ${m}`),
  success: (m) => console.log(`${ts()} ${chalk.green('[+]')} ${m}`),
  error:   (m) => console.log(`${ts()} ${chalk.red('[-]')} ${m}`),
  warn:    (m) => console.log(`${ts()} ${chalk.yellow('[!]')} ${m}`),
  pairing: (code) => {
    console.log()
    console.log(chalk.gray('  ') + chalk.yellow('[ PAIRING CODE ]'))
    console.log(chalk.gray('  ') + chalk.white.bold(code))
    console.log()
  },
  plugin:  (name) => console.log(`${ts()} ${chalk.magenta('[PLUGIN]')} ${chalk.dim('loaded')} ${chalk.white(name)}`),
  reload:  (type, name) => {
    const c = { RELOAD: chalk.blue, 'NEW FILE': chalk.green, DELETE: chalk.red }
    console.log(`${ts()} ${(c[type] || chalk.white)(`[ ${type} ]`)} ${chalk.white(name)}`)
  },
  cmd:     (name, sender) => console.log(`${ts()} ${chalk.yellow('[CMD]')} ${chalk.white(name)} ${chalk.gray('<-')} ${chalk.dim(sender)}`),
}
