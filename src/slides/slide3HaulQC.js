const SW = 1080
const SH = 1920
const GAP = 10

async function drawCell(ctx, x, y, w, h, imgUrl, num, loadImg) {
  try {
    const img = await loadImg(imgUrl)

    const scale = Math.max(w / img.width, h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale

    const dx = x + (w - dw) / 2
    const dy = y + (h - dh) / 2

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 14)
    ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
  } catch {
    ctx.fillStyle = '#111'
    ctx.fillRect(x, y, w, h)
  }

  // badge discret
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.beginPath()
  ctx.roundRect(x + 14, y + 14, 44, 44, 10)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(num, x + 36, y + 42)
}

export async function renderSlide3Haul(articles, loadImg) {
  const c = document.createElement('canvas')
  c.width = SW
  c.height = SH
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  const cx = SW / 2

  // Header variant
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial Black'
  ctx.textAlign = 'center'
  ctx.fillText('MORE DETAILS', cx, 120)

  ctx.fillStyle = '#ff0000'
  ctx.font = '32px Arial'
  ctx.fillText('ZOOM QC', cx, 165)

  // Grid
  const TOP = 220
  const CELL_W = (SW - GAP * 3) / 2
  const CELL_H = (SH - TOP - GAP * 3 - 140) / 2

  for (let i = 0; i < 4; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)

    const x = GAP + col * (CELL_W + GAP)
    const y = TOP + GAP + row * (CELL_H + GAP)

    const art = articles[i]
    const qcUrls = art?.qcUrls || []

    const qcUrl = qcUrls[1] || qcUrls[2] || qcUrls[0] || art?.picUrl || ''

    await drawCell(ctx, x, y, CELL_W, CELL_H, qcUrl, i + 1, loadImg)
  }

  // CTA final vers conversion
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '36px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('SPREADSHEET EN BIO →', cx, SH - 80)

  return c
}