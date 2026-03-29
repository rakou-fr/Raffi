const SW = 1080, SH = 1920

const PHRASES = [
  "MEILLEUR HAUL\nPOUR L'ÉTÉ",
  "LE HAUL QUI CHANGE\nTON STYLE",
  "PIÈCES\nUNDERRATED",
  "HAUL À PRIX\nCASSÉS",
  "CE QUE J'AI\nCOMMANDÉ",
  "TOP FINDS\nDU MOMENT",
  "HAUL\nDE LA SEMAINE",
  "QUALITÉ\nINCROYABLE",
  "LE HAUL\nATTENDU",
  "PIÈCES\nRARES",
]

export async function renderSlide1Haul(bgDataUrl, loadImg) {
  const c = document.createElement('canvas')
  c.width = SW
  c.height = SH
  const ctx = c.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  // Image
  if (bgDataUrl) {
    try {
      const img = await loadImg(bgDataUrl)
      const r = Math.max(SW / img.width, SH / img.height)
      const dw = img.width * r
      const dh = img.height * r

      ctx.globalAlpha = 0.45
      ctx.drawImage(img, (SW - dw) / 2, (SH - dh) / 2, dw, dh)
      ctx.globalAlpha = 1
    } catch {}
  }

  // Gradient
  const g = ctx.createLinearGradient(0, 0, 0, SH)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.5, 'rgba(0,0,0,0.3)')
  g.addColorStop(1, 'rgba(0,0,0,0.9)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SW, SH)

  const cx = SW / 2

  // Brand
  ctx.fillStyle = '#ff0000'
  ctx.font = 'bold 58px Arial Black, Arial'
  ctx.textAlign = 'center'
  ctx.fillText('MYCNBOX', cx, 140)

  // Phrase
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
  const lines = phrase.split('\n')

  const maxWidth = SW - 160

  let fontSize = 120
  let fits = false

  // 🔥 Auto-scale loop
  while (!fits && fontSize > 40) {
    ctx.font = `bold ${fontSize}px Arial Black, Arial`
    fits = lines.every(line => ctx.measureText(line).width <= maxWidth)

    if (!fits) fontSize -= 4
  }

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'

  const lineHeight = fontSize * 1.1
  const totalH = lines.length * lineHeight
  let y = (SH - totalH) / 2

  lines.forEach(line => {
    ctx.fillText(line, cx, y)
    y += lineHeight
  })

  // Accent rouge
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(cx - 120, y + 20, 240, 6)

  // CTA
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '40px Arial'
  ctx.fillText('SWIPE →', cx, SH - 100)

  return c
}