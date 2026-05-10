<div align="center">

<img src="https://ik.imagekit.io/bayuofficial/file_000000005d7471faaab4d286560fe345.png" width="100%" alt="Lumi Hevia Banner" />

# LUMI HEVIA

<p>
  Lightweight WhatsApp bot base built with modern structure, fast handler system, and clean modular architecture.
</p>

<p>
  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#structure">Structure</a> •
  <a href="#usage">Usage</a>
</p>

</div>

---

## Overview

Lumi Hevia is a modern WhatsApp bot base powered by Baileys with a simple development workflow and organized command system. Designed for developers who prefer a clean and scalable project structure without unnecessary complexity.

The project focuses on readability, modular commands, fast execution, and easy customization.

---

## Features

<table>
<tr>
<td width="50%">

### Core System

* ES Module support
* Fast command handler
* Dynamic command loader
* Hot reload watcher
* Modular structure
* Console logger system
* Cooldown protection

</td>
<td width="50%">

### Utilities

* Backup command
* HTTP request tools
* Runtime execution
* Interactive button support
* Contact message support
* Pin message support
* CRM utilities

</td>
</tr>
</table>

---

## Installation

```bash
git clone https://github.com/bayudeveloper/lumi-hevia
cd lumi-hevia
npm install
```

---

## Configuration

Edit the configuration file inside:

```bash
config/index.js
```

Example configuration:

```js
export const config = {
  botName: 'Lumi Hevia',
  version: 'Alpha',
  author: 'Bayu Official',
  ownerNumber: ['62895406178006'],
  timezone: 'Asia/Jakarta'
}
```

---

## Running The Bot

### Normal Mode

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

---

## Project Structure

```bash
Lumi-Base/
├── commands/
├── config/
├── lib/
├── watcher/
├── index.js
├── package.json
└── README.md
```

---

## Command System

Every command is separated into its own file for easier maintenance.

Example:

```js
export default {
  name: 'ping',
  execute: async ({ sock, m }) => {
    await sock.sendMessage(m.key.remoteJid, {
      text: 'Pong'
    })
  }
}
```

---

## Dependencies

| Package                 | Function            |
| ----------------------- | ------------------- |
| @whiskeysockets/baileys | WhatsApp connection |
| chokidar                | File watcher        |
| chalk                   | Console styling     |
| axios                   | HTTP requests       |
| moment-timezone         | Timezone support    |
| pino                    | Logging system      |

---

## Notes

* Requires Node.js v20 or higher
* Recommended for Linux, VPS, and Pterodactyl
* Keep your session folder secure
* Do not expose owner credentials publicly

---

## Credits

<table>
<tr>
<td>

Developer
**Bayu Official**

</td>
<td>

Base
**Lumi Hevia**

</td>
</tr>
</table>

---

<div align="center">

```txt
Lumi Hevia — Alpha Build
Modern WhatsApp Bot Base
```

</div>
