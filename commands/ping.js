import os from 'os'
import { Button } from '../lib/builder.js'
import { getRuntime, getRAM, getCPU } from '../lib/utils.js'

export default {
  name: 'Ping',
  command: ['ping', 'speed'],
  category: 'general',
  description: 'Cek kecepatan dan info sistem bot',
  ownerOnly: false,
  cooldown: 3000,

  async execute({ sock, m, chat, startTime }) {
    const t0      = Date.now()
    const runtime = getRuntime(startTime)
    const ram     = getRAM()
    const cpu     = getCPU()
    const latency = `${Date.now() - t0} ms`

    const body = [
      `*PONG*`,
      ``,
      `Speed    : ${latency}`,
      `Runtime  : ${runtime}`,
      `RAM      : ${ram}`,
      `CPU      : ${cpu}`,
      `Platform : ${os.platform()}`,
      `Node     : ${process.version}`,
    ].join('\n')

    const btn = new Button()
    btn
      .setTitle('Ping')
      .setBody(body)
      .setFooter('Lumi Hevia | System Info')
      .addReply('Refresh', 'ping')
      .addReply('Menu', 'menu')

    await btn.run(chat, sock, m)
  },
}
