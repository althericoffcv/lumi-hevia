import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function makeWelcomeCard({ name, groupName, memberCount, avatarUrl }) {
  const W = 800, H = 300
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#0f0c29')
  grad.addColorStop(1, '#302b63')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#7c3aed'
  ctx.lineWidth   = 2
  ctx.strokeRect(10, 10, W - 20, H - 20)

  const R    = 70
  const cx   = 110
  const cy   = H / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  try {
    if (avatarUrl) {
      const img = await loadImage(avatarUrl)
      ctx.drawImage(img, cx - R, cy - R, R * 2, R * 2)
    } else {
      ctx.fillStyle = '#7c3aed'
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
    }
  } catch {
    ctx.fillStyle = '#7c3aed'
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  }
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 28px sans-serif'
  ctx.fillText('Welcome', 210, cy - 50)

  ctx.font      = 'bold 22px sans-serif'
  ctx.fillStyle = '#a78bfa'
  ctx.fillText(name.slice(0, 28), 210, cy - 15)

  ctx.font      = '16px sans-serif'
  ctx.fillStyle = '#d1d5db'
  ctx.fillText(`to ${groupName.slice(0, 30)}`, 210, cy + 20)
  ctx.fillText(`Member ke-${memberCount}`, 210, cy + 50)

  return canvas.toBuffer('image/jpeg')
}

export async function makeGoodbyeCard({ name, groupName, avatarUrl }) {
  const W = 800, H = 300
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#1a0000')
  grad.addColorStop(1, '#3b0000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth   = 2
  ctx.strokeRect(10, 10, W - 20, H - 20)

  const R  = 70
  const cx = 110
  const cy = H / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  try {
    if (avatarUrl) {
      const img = await loadImage(avatarUrl)
      ctx.drawImage(img, cx - R, cy - R, R * 2, R * 2)
    } else {
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
    }
  } catch {
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  }
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 28px sans-serif'
  ctx.fillText('Goodbye', 210, cy - 50)

  ctx.font      = 'bold 22px sans-serif'
  ctx.fillStyle = '#fca5a5'
  ctx.fillText(name.slice(0, 28), 210, cy - 15)

  ctx.font      = '16px sans-serif'
  ctx.fillStyle = '#d1d5db'
  ctx.fillText(`has left ${groupName.slice(0, 30)}`, 210, cy + 20)

  return canvas.toBuffer('image/jpeg')
}

export async function makeGroupReport({ groupName, members, totalMessages, topUsers }) {
  const W    = 800
  const H    = 420
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#374151'
  ctx.lineWidth   = 1
  ctx.strokeRect(10, 10, W - 20, H - 20)

  ctx.fillStyle = '#f9fafb'
  ctx.font      = 'bold 24px sans-serif'
  ctx.fillText(`Group Report`, 30, 55)

  ctx.fillStyle = '#9ca3af'
  ctx.font      = '14px sans-serif'
  ctx.fillText(groupName.slice(0, 50), 30, 80)

  ctx.fillStyle = '#6b7280'
  ctx.fillRect(30, 95, W - 60, 1)

  const stats = [
    { label: 'Total Members', value: String(members) },
    { label: 'Total Messages', value: String(totalMessages) },
    { label: 'Active Users', value: String(topUsers.length) },
  ]
  stats.forEach(({ label, value }, i) => {
    const x = 30 + i * 240
    ctx.fillStyle = '#6b7280'
    ctx.font      = '13px sans-serif'
    ctx.fillText(label, x, 130)
    ctx.fillStyle = '#f9fafb'
    ctx.font      = 'bold 22px sans-serif'
    ctx.fillText(value, x, 158)
  })

  ctx.fillStyle = '#f9fafb'
  ctx.font      = 'bold 15px sans-serif'
  ctx.fillText('Top Active Members', 30, 200)

  topUsers.slice(0, 5).forEach(({ name, count }, i) => {
    const y   = 230 + i * 34
    const bar = Math.min((count / (topUsers[0]?.count || 1)) * 500, 500)
    ctx.fillStyle = '#1d4ed8'
    ctx.fillRect(30, y, bar, 22)
    ctx.fillStyle = '#ffffff'
    ctx.font      = '13px sans-serif'
    ctx.fillText(`${i + 1}. ${name.slice(0, 20)} — ${count} msg`, 36, y + 15)
  })

  return canvas.toBuffer('image/jpeg')
}

export async function makeHeatmap({ groupName, hourlyData }) {
  const W      = 800
  const H      = 320
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#f1f5f9'
  ctx.font      = 'bold 20px sans-serif'
  ctx.fillText(`Activity Heatmap — ${groupName.slice(0, 35)}`, 30, 40)

  const maxVal  = Math.max(...hourlyData, 1)
  const cellW   = 28
  const cellH   = 22
  const startX  = 55
  const startY  = 70

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const days  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  days.forEach((day, di) => {
    ctx.fillStyle = '#94a3b8'
    ctx.font      = '11px sans-serif'
    ctx.fillText(day, 10, startY + di * (cellH + 4) + 14)

    hours.forEach((h) => {
      const val     = hourlyData[di * 24 + h] || 0
      const ratio   = val / maxVal
      const alpha   = 0.1 + ratio * 0.9
      ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`
      ctx.fillRect(startX + h * (cellW + 2), startY + di * (cellH + 4), cellW, cellH)
    })
  })

  for (let h = 0; h < 24; h += 3) {
    ctx.fillStyle = '#64748b'
    ctx.font      = '10px sans-serif'
    ctx.fillText(`${h}:00`, startX + h * (cellW + 2), startY + 7 * (cellH + 4) + 15)
  }

  return canvas.toBuffer('image/jpeg')
}
