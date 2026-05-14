// toko.js
import { getRuntime } from '../lib/utils.js'

export default {
  name: 'MenuToko',
  command: ['product', 'menutoko'],
  category: 'store',
  description: 'Menampilkan katalog jasa design website',
  ownerOnly: false,
  cooldown: 5000,

  async execute({ sock, m, chat, startTime }) {
    const t0 = Date.now()
    const runtime = getRuntime(startTime)
    const speed = `${Date.now() - t0} ms`

    const rawContent = {
      "productMessage": {
        "product": {
          "productImage": {
            "url": "https://mmg.whatsapp.net/v/t62.7118-24/694935752_1730745224760121_5731593791241077826_n.enc?ccb=11-4&oh=01_Q5Aa4gEz7UXvjMMOgO1K3ZF4MKlYJwXoJs-nYKEFrDlxKUcXwQ&oe=6A27CE57&_nc_sid=5e03e0&mms3=true",
            "mimetype": "image/jpeg",
            "fileSha256": "BFTsWw23RpatyMVWl2JP8/sr5j75eD3scBqv5oTQviU=",
            "fileLength": "175231",
            "height": 1024,
            "width": 1536,
            "mediaKey": "smIsd5XAD7r/OEFw+ij/ZMRIuI6rCTog8KseeKcaxu0=",
            "fileEncSha256": "pcaiQ05uip9o4TQpoL/GhQgQ1BEBvB62+upiOViZHqA=",
            "directPath": "/v/t62.7118-24/694935752_1730745224760121_5731593791241077826_n.enc?ccb=11-4&oh=01_Q5Aa4gEz7UXvjMMOgO1K3ZF4MKlYJwXoJs-nYKEFrDlxKUcXwQ&oe=6A27CE57&_nc_sid=5e03e0",
            "mediaKeyTimestamp": "1778401944",
            "jpegThumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIADAASAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAEAAMFAQIGAQEBAQEAAAAAAAAAAAAAAAABAAID/9oADAMBAAIQAxAAAABDDMO9ufqfN3PzsmMa3DtrQEslsiBMyL+b1S0vNdytcaqIFK5qVDdy0eLTbb6+eJ034zM59TsD/8QAKRAAAgIBAwMDAwUAAAAAAAAAAQIAAxEEEiETIkExMlEUFTNCUnGCof/aAAgBAQABPwCrjtaJV8GLkTV6pqjsUcwXW53bzmaS3rpz7hCCsZXY/EtwO0SuxMZIlbL4m4BST6CFzfqiwGeY+kwrWAZyPbNM502oAecEZjcx3rSI9TLjETb4MD7VORBeabzYoBG6fcKtnUDf1mns6mrVyOC0dyBwJax+ZaUAx6mVVspErrCjJMfUK2UB/mV6VHsOR2Q6Oj4mn06JuLjzxEYOktTyDzLqjAFrIDHMZd49e0R6TuJVsQLYB+SN1Co75h/LmadnB90L8cy0AjM011bp38wWe4CO7ft5jXkHlZ9SMDth1OP0yi7cYl4OFzLtiow/2f/EABwRAAMAAgMBAAAAAAAAAAAAAAABESIxAhBRIf/aAAgBAgEBPwCF8K0bIO9/RIVq8MTEbS0Xmf/EABwRAQEAAgMBAQAAAAAAAAAAAAEAAhEQElEhIv/aAAgBAwEBPwByg2/ZBLF1djy36WuDRK+cHa/VkXW//9k=",
          },
          "productId": "26693864953598073",
          "title": "𝗟𝘂𝗺𝗶 𝗛𝗲𝘃𝗶𝗮",
          "description": `𝗥𝘂𝗻𝘁𝗶𝗺𝗲 : ${runtime}\n𝗦𝗽𝗲𝗲𝗱 : ${speed}`,
          "productImageCount": 1
        },
        "businessOwnerJid": "114860746633351@lid"
      }
    }

    await sock.relayMessage(chat, rawContent, {
      messageId: "LH" + Date.now()
    })
  }
}