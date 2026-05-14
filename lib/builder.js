/**
 * Builder library for WhatsApp interactive messages
 * and AI rich response payloads using Baileys.
 *
 * Created By Nixel
 * Modified by Lumi Hevia - Added Image Resolution Support (13:9)
 *
 * VERSION: 3.3
 */

import { generateWAMessageFromContent, prepareWAMessageMedia } from '@whiskeysockets/baileys'
import axios from 'axios'
import crypto from 'crypto'

export class Button {
  constructor() {
    this._title = ''
    this._subtitle = ''
    this._body = ''
    this._footer = ''
    this._thumbnail = null
    this._beton = []
    this._data = undefined
    this._contextInfo = {}
    this._currentSelectionIndex = -1
    this._currentSectionIndex = -1
    this._type = 0
    this._betonOld = []
    this._params = {}
    // Location properties
    this._isLocation = false
    this._locationName = ''
    this._locationAddress = ''
    this._locationThumbnail = null
    this._latitude = 0
    this._longitude = 0
  }

  setVideo(path, options = {}) {
    if (!path) return new Error('Url or buffer needed')
    Buffer.isBuffer(path)
      ? (this._data = { video: path, ...options })
      : (this._data = { video: { url: path }, ...options })
    return this
  }

  setImage(path, options = {}) {
    if (!path) return new Error('Url or buffer needed')
    Buffer.isBuffer(path)
      ? (this._data = { image: path, ...options })
      : (this._data = { image: { url: path }, ...options })
    return this
  }

  setDocument(path, options = {}) {
    if (!path) return new Error('Url or buffer needed')
    Buffer.isBuffer(path)
      ? (this._data = { document: path, ...options })
      : (this._data = { document: { url: path }, ...options })
    return this
  }

  setMedia(obj) {
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      this._data = obj
    } else {
      return 'Type of media must be an Object'
    }
    return this
  }

  setThumbnail(thumbnail) {
    this._thumbnail = thumbnail
    return this
  }

  setTitle(title) {
    this._title = title
    return this
  }

  setSubtitle(subtitle) {
    this._subtitle = subtitle
    return this
  }

  setBody(body) {
    this._body = body
    return this
  }

  setFooter(footer) {
    this._footer = footer
    return this
  }

  setContextInfo(obj) {
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      this._contextInfo = obj
    } else {
      return 'Type of contextInfo must be an Object'
    }
    return this
  }

  setParams(obj) {
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      this._params = obj
    } else {
      return 'Type of params must be an Object'
    }
    return this
  }

  setButton(name, params) {
    this._beton.push({ name, buttonParamsJson: JSON.stringify(params) })
    return this
  }

  setButtonV2(params) {
    this._betonOld.push(params)
    return this
  }

  makeRow(header = '', title = '', description = '', id = '') {
    if (this._currentSelectionIndex === -1 || this._currentSectionIndex === -1) {
      throw new Error('You need to create a selection and a section first')
    }
    const buttonParams = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
    buttonParams.sections[this._currentSectionIndex].rows.push({ header, title, description, id })
    this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(buttonParams)
    return this
  }

  makeSections(title = '', highlight_label = '') {
    if (this._currentSelectionIndex === -1) {
      throw new Error('You need to create a selection first')
    }
    const buttonParams = JSON.parse(this._beton[this._currentSelectionIndex].buttonParamsJson)
    buttonParams.sections.push({ title, highlight_label, rows: [] })
    this._currentSectionIndex = buttonParams.sections.length - 1
    this._beton[this._currentSelectionIndex].buttonParamsJson = JSON.stringify(buttonParams)
    return this
  }

  addSelection(title) {
    this._beton.push({ name: 'single_select', buttonParamsJson: JSON.stringify({ title, sections: [] }) })
    this._currentSelectionIndex = this._beton.length - 1
    this._currentSectionIndex = -1
    return this
  }

  addReply(display_text = '', id = '') {
    this._beton.push({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text, id }) })
    return this
  }

  addReplyV2(displayText = 'Nixel', buttonId = 'Nixel') {
    this._betonOld.push({ buttonId, buttonText: { displayText }, type: 1 })
    this._type = 1
    return this
  }

  addCall(display_text = '', id = '') {
    this._beton.push({
      name: 'cta_call',
      buttonParamsJson: JSON.stringify({ display_text, id }),
    })
    return this
  }

  addReminder(display_text = '', id = '') {
    this._beton.push({
      name: 'cta_reminder',
      buttonParamsJson: JSON.stringify({ display_text, id }),
    })
    return this
  }

  addCancelReminder(display_text = '', id = '') {
    this._beton.push({
      name: 'cta_cancel_reminder',
      buttonParamsJson: JSON.stringify({ display_text, id }),
    })
    return this
  }

  addAddress(display_text = '', id = '') {
    this._beton.push({
      name: 'address_message',
      buttonParamsJson: JSON.stringify({ display_text, id }),
    })
    return this
  }

  addLocation() {
    this._beton.push({ name: 'send_location', buttonParamsJson: '' })
    return this
  }

  addUrl(display_text = '', url = '', webview_interaction = false) {
    this._beton.push({
      name: 'cta_url',
      buttonParamsJson: JSON.stringify({ display_text, url, webview_interaction }),
    })
    return this
  }

  addCopy(display_text = '', copy_code = '', id = '') {
    this._beton.push({
      name: 'cta_copy',
      buttonParamsJson: JSON.stringify({ display_text, copy_code, id }),
    })
    return this
  }

  setLocation(name = '', address = '', latitude = 0, longitude = 0, thumbnail = null) {
    this._isLocation = true
    this._locationName = name
    this._locationAddress = address
    this._latitude = latitude
    this._longitude = longitude
    this._locationThumbnail = thumbnail
    return this
  }

  async _processLocationThumbnail() {
    if (!this._locationThumbnail) return null
    
    try {
      let thumbBuffer
      if (Buffer.isBuffer(this._locationThumbnail)) {
        thumbBuffer = this._locationThumbnail
      } else if (typeof this._locationThumbnail === 'string') {
        const response = await axios.get(this._locationThumbnail, { 
          responseType: 'arraybuffer',
          timeout: 8000
        })
        thumbBuffer = Buffer.from(response.data)
      }
      return thumbBuffer
    } catch (error) {
      console.error('Error loading location thumbnail:', error.message)
      return null
    }
  }

  async run(jid, conn, quoted = '', { bypass = false, ...options } = {}) {
    if (this._type === 0) {
      let headerData = {}
      
      if (this._isLocation) {
        const thumbBuffer = await this._processLocationThumbnail()
        headerData = {
          locationMessage: {
            degreesLatitude: this._latitude,
            degreesLongitude: this._longitude,
            name: this._locationName,
            address: this._locationAddress,
            jpegThumbnail: thumbBuffer || Buffer.alloc(0)
          },
          hasMediaAttachment: true
        }
      } 
      else if (this._data) {
        headerData = await prepareWAMessageMedia(this._data, { upload: conn.waUploadToServer })
        headerData.hasMediaAttachment = true
      } 
      else if (this._thumbnail) {
        headerData = await prepareWAMessageMedia({ image: { url: this._thumbnail } }, { upload: conn.waUploadToServer })
        headerData.hasMediaAttachment = true
      }
      else {
        headerData = {
          title: this._title,
          subtitle: this._subtitle,
          hasMediaAttachment: false
        }
      }

      const message = {
        body: { text: this._body },
        footer: { text: this._footer },
        header: headerData,
      }

      const msg = generateWAMessageFromContent(
        jid,
        {
          interactiveMessage: {
            ...message,
            contextInfo: this._contextInfo,
            nativeFlowMessage: {
              messageParamsJson: JSON.stringify(this._params),
              buttons: this._beton,
            },
          },
        },
        { quoted }
      )

      await conn.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
          {
            tag: 'biz',
            attrs: {},
            content: [
              {
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
              },
            ],
          },
        ],
        ...options,
      })

      return msg
    } else {
      const msg = generateWAMessageFromContent(
        jid,
        {
          buttonsMessage: {
            ...(this._data ? this._data : {}),
            [this._data ? 'caption' : 'contentText']: this._body,
            title: this._data ? null : this._title,
            footerText: this._footer,
            ...(bypass ? { headerType: 6, locationMessage: {} } : {}),
            viewOnce: true,
            contextInfo: this._contextInfo,
            buttons: [
              ...this._betonOld,
              ...this._beton.map((nixel) => ({
                buttonId: 'Nixel',
                buttonText: { displayText: 'Nixel' },
                type: 1,
                nativeFlowInfo: {
                  name: nixel.name,
                  paramsJson: nixel.buttonParamsJson,
                },
              })),
            ],
          },
        },
        { quoted, ...options }
      )

      await conn.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
          {
            tag: 'biz',
            attrs: {},
            content: [
              {
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
              },
            ],
          },
        ],
        ...options,
      })

      return msg
    }
  }
}

export class AIRich {
  constructor() {
    this._submessages = []
    this._sections = []
    this._richResponseSources = []
  }

  addText(text) {
    this._submessages.push({ messageType: 2, messageText: text })
    this._sections.push({
      view_model: {
        primitive: { text, __typename: 'GenAIMarkdownTextUXPrimitive' },
        __typename: 'GenAISingleLayoutViewModel',
      },
    })
    return this
  }

  addCode(language, code) {
    const meta = this.tokenizer(code, language)
    this._submessages.push({
      messageType: 5,
      codeMetadata: { codeLanguage: language, codeBlocks: meta.codeBlock },
    })
    this._sections.push({
      view_model: {
        primitive: {
          language,
          code_blocks: meta.unified_codeBlock,
          __typename: 'GenAICodeUXPrimitive',
        },
        __typename: 'GenAISingleLayoutViewModel',
      },
    })
    return this
  }

  addTable(table) {
    const meta = this.toTableMetadata(table)
    this._submessages.push({
      messageType: 4,
      tableMetadata: { title: meta.title, rows: meta.rows },
    })
    this._sections.push({
      view_model: {
        primitive: { rows: meta.unified_rows, __typename: 'GenATableUXPrimitive' },
        __typename: 'GenAISingleLayoutViewModel',
      },
    })
    return this
  }

  addSource(sources = []) {
    const source = sources.map(([profile_url, url, text]) => ({
      source_type: 'THIRD_PARTY',
      source_display_name: text,
      source_subtitle: 'AI',
      source_url: url,
      favicon: { url: profile_url, mime_type: 'image/jpeg', width: 16, height: 16 },
    }))
    this._sections.push({
      view_model: {
        primitive: { sources: source, __typename: 'GenAISearchResultPrimitive' },
        __typename: 'GenAISingleLayoutViewModel',
      },
    })
    return this
  }

  addReels(reelsItems = []) {
    this._submessages.push({
      messageType: 9,
      contentItemsMetadata: {
        contentType: 1,
        itemsMetadata: reelsItems.map((item) => ({
          reelItem: {
            title: item.title,
            profileIconUrl: item.profileIconUrl,
            thumbnailUrl: item.thumbnailUrl,
            videoUrl: item.videoUrl,
          },
        })),
      },
    })
    reelsItems.forEach((item, idx) => {
      this._richResponseSources.push({
        provider: 'UNKNOWN',
        thumbnailCDNURL: item.thumbnailUrl,
        sourceProviderURL: item.videoUrl,
        sourceQuery: '',
        faviconCDNURL: item.profileIconUrl,
        citationNumber: idx + 1,
        sourceTitle: item.title,
      })
    })
    this._sections.push({
      view_model: {
        primitives: reelsItems.map((item) => ({
          reels_url: item.videoUrl,
          thumbnail_url: item.thumbnailUrl,
          creator: item.title,
          avatar_url: item.profileIconUrl,
          reels_title: item.reels_title,
          likes_count: 0,
          shares_count: 0,
          view_count: 0,
          reel_source: 'IG',
          is_verified: item.is_verified,
          __typename: 'GenAIReelPrimitive',
        })),
        __typename: 'GenAIHScrollLayoutViewModel',
      },
    })
    return this
  }

  // METHOD addImage YANG SUDAH DI MODIFIKASI DENGAN RESOLUSI 13:9
  addImage(imageUrl, options = {}) {
    // Rasio 13:9 = width 520, height 360 (atau bisa disesuaikan)
    const { width = 520, height = 360, fit = 'cover' } = options
    
    const imageUrls = Array.isArray(imageUrl)
      ? imageUrl.map((url) => ({ 
          imagePreviewUrl: url, 
          sourceUrl: 'https://google.com',
          width: width,
          height: height
        }))
      : [{ 
          imagePreviewUrl: imageUrl, 
          sourceUrl: 'https://google.com',
          width: width,
          height: height
        }]

    this._submessages.push({
      messageType: 1,
      gridImageMetadata: {
        gridImageUrl: { 
          imagePreviewUrl: Array.isArray(imageUrl) ? imageUrl[0] : imageUrl,
          width: width,
          height: height
        },
        imageUrls,
      },
    })
    
    imageUrls.forEach(({ imagePreviewUrl }) => {
      this._sections.push({
        view_model: {
          primitive: {
            media: { 
              url: imagePreviewUrl, 
              mime_type: 'image/jpeg',
              width: width,
              height: height
            },
            imagine_type: 3,
            status: { status: 'READY' },
            __typename: 'GenAIImaginePrimitive',
          },
          __typename: 'GenAISingleLayoutViewModel',
        },
      })
    })
    return this
  }

  build({ forwarded = true, includesUnifiedResponse = true } = {}) {
    const contextInfo = forwarded
      ? {
          forwardingScore: 1,
          isForwarded: true,
          forwardedAiBotMessageInfo: { botJid: '0@bot' },
          forwardOrigin: 4,
        }
      : {}
    return {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {
          pluginMetadata: {},
          richResponseSourcesMetadata: { sources: this._richResponseSources },
        },
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: this._submessages,
            unifiedResponse: {
              data: includesUnifiedResponse
                ? Buffer.from(
                    JSON.stringify({
                      response_id: crypto.randomUUID(),
                      sections: this._sections,
                    })
                  ).toString('base64')
                : '',
            },
            contextInfo,
          },
        },
      },
    }
  }

  async run(chat, conn, { forwarded, includesUnifiedResponse, ...options } = {}) {
    const payload = this.build({ forwarded, includesUnifiedResponse })
    return await conn.relayMessage(chat, payload, { ...options })
  }

  tokenizer(code, lang = 'javascript') {
    const keywordsMap = {
      javascript: new Set([
        'break', 'case', 'catch', 'continue', 'debugger', 'delete', 'do', 'else',
        'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return',
        'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
        'true', 'false', 'null', 'undefined', 'class', 'const', 'let', 'super',
        'extends', 'export', 'import', 'yield', 'static', 'constructor', 'async',
        'await', 'get', 'set',
      ]),
    }
    const TYPE_MAP = { 0: 'DEFAULT', 1: 'KEYWORD', 2: 'METHOD', 3: 'STR', 4: 'NUMBER', 5: 'COMMENT' }
    const keywords = keywordsMap[lang] || new Set()
    const tokens = []
    let i = 0
    const push = (content, type) => {
      if (!content) return
      const last = tokens[tokens.length - 1]
      if (last && last.highlightType === type) last.codeContent += content
      else tokens.push({ codeContent: content, highlightType: type })
    }
    while (i < code.length) {
      const c = code[i]
      if (/\s/.test(c)) {
        let s = i
        while (i < code.length && /\s/.test(code[i])) i++
        push(code.slice(s, i), 0)
        continue
      }
      if (c === '/' && code[i + 1] === '/') {
        let s = i; i += 2
        while (i < code.length && code[i] !== '\n') i++
        push(code.slice(s, i), 5)
        continue
      }
      if (c === '"' || c === "'" || c === '`') {
        let s = i; const q = c; i++
        while (i < code.length) {
          if (code[i] === '\\' && i + 1 < code.length) i += 2
          else if (code[i] === q) { i++; break }
          else i++
        }
        push(code.slice(s, i), 3)
        continue
      }
      if (/[0-9]/.test(c)) {
        let s = i
        while (i < code.length && /[0-9.]/.test(code[i])) i++
        push(code.slice(s, i), 4)
        continue
      }
      if (/[a-zA-Z_$]/.test(c)) {
        let s = i
        while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++
        const word = code.slice(s, i)
        let type = 0
        if (keywords.has(word)) type = 1
        else {
          let j = i
          while (j < code.length && /\s/.test(code[j])) j++
          if (code[j] === '(') type = 2
        }
        push(word, type)
        continue
      }
      push(c, 0)
      i++
    }
    return {
      codeBlock: tokens,
      unified_codeBlock: tokens.map((t) => ({ content: t.codeContent, type: TYPE_MAP[t.highlightType] })),
    }
  }

  toTableMetadata(arr) {
    if (!Array.isArray(arr) || arr.length < 2) throw new Error('Format tabel ngawur')
    const [header, ...rows] = arr
    const maxLen = Math.max(header.length, ...rows.map((r) => r.length))
    const normalize = (r) => [...r, ...Array(maxLen - r.length).fill('')]
    const unified_rows = [
      { is_header: true, cells: normalize(header) },
      ...rows.map((r) => ({ is_header: false, cells: normalize(r) })),
    ]
    const rowsMeta = unified_rows.map((r) => ({
      items: r.cells,
      ...(r.is_header ? { isHeading: true } : {}),
    }))
    return { title: '', rows: rowsMeta, unified_rows }
  }
}