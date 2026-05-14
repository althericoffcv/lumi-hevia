import { config } from '../config/index.js'

export function makeAdReply(title, body, sourceUrl) {
  return {
    externalAdReply: {
      title: title || config.botName,
      body:  body  || config.footer,
      mediaType: 1,
      thumbnailUrl: config.image,
      sourceUrl: sourceUrl || `https://wa.me/${config.ownerNumber[0].replace(/[^0-9]/g, '')}`,
      renderLargerThumbnail: false,
      showAdAttribution: false,
    },
  }
}
