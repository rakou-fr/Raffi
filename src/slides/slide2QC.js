// Slide 2 — QC Photo 1
// Photo QC centrée + badge + numéro + flèche swipe
// Format : 1080×1920

const SW = 1080, SH = 1920

export async function renderSlide2(qcUrl, loadImg) {
  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  // Fond très sombre
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  // ── Image QC — centrée avec padding, fond noir derrière
  const PAD    = 40
  const IMG_W  = SW - PAD * 2
  const IMG_H  = Math.round(SH * 0.72)
  const IMG_Y  = Math.round((SH - IMG_H) / 2)

  try {
    const img = await loadImg(qcUrl)

    // Calcule le scale pour contenir l'image dans la zone (contain, pas cover)
    const scale = Math.min(IMG_W / img.width, IMG_H / img.height)
    const dw    = img.width  * scale
    const dh    = img.height * scale
    const dx    = PAD + (IMG_W - dw) / 2
    const dy    = IMG_Y + (IMG_H - dh) / 2

    // Ombre douce derrière l'image
    ctx.shadowColor = 'rgba(255,60,60,.25)'
    ctx.shadowBlur  = 60
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.shadowBlur  = 0
  } catch {}

  // ── Gradient haut
  const gTop = ctx.createLinearGradient(0, 0, 0, 220)
  gTop.addColorStop(0, 'rgba(0,0,0,.9)')
  gTop.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gTop
  ctx.fillRect(0, 0, SW, 220)

  // ── Gradient bas
  const gBot = ctx.createLinearGradient(0, SH - 260, 0, SH)
  gBot.addColorStop(0, 'rgba(0,0,0,0)')
  gBot.addColorStop(1, 'rgba(0,0,0,.92)')
  ctx.fillStyle = gBot
  ctx.fillRect(0, SH - 260, SW, 260)

  // ── Badge "QUALITY CHECK" haut gauche
  ctx.fillStyle = 'rgba(0,0,0,.75)'
  ctx.beginPath()
  ctx.roundRect(50, 52, 340, 70, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,60,60,.5)'
  ctx.lineWidth   = 2
  ctx.stroke()

  ctx.font      = 'bold 34px Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.fillText('QUALITY CHECK', 72, 100)

  // ── Numéro slide (cercle rouge, haut droit)
  const CX_NUM = SW - 90
  const CY_NUM = 92
  ctx.fillStyle = '#ff3c3c'
  ctx.beginPath()
  ctx.arc(CX_NUM, CY_NUM, 52, 0, Math.PI * 2)
  ctx.fill()
  ctx.font        = 'bold 58px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.textAlign   = 'center'
  ctx.fillText('1', CX_NUM, CY_NUM + 20)

  // ── Flèche "SWIPE" bas — couleur rouge (couleur du numéro)
  const ARROW_Y = SH - 110

  // Texte swipe
  ctx.font      = 'bold 38px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.5)'
  ctx.textAlign = 'center'
  ctx.fillText('SWIPE', SW / 2 - 60, ARROW_Y + 14)

  // Flèche →
  ctx.strokeStyle = '#ff3c3c'
  ctx.lineWidth   = 6
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  const AX = SW / 2 + 40
  const AY = ARROW_Y
  // Corps de la flèche
  ctx.beginPath()
  ctx.moveTo(AX, AY)
  ctx.lineTo(AX + 120, AY)
  ctx.stroke()
  // Pointe
  ctx.beginPath()
  ctx.moveTo(AX + 80, AY - 36)
  ctx.lineTo(AX + 120, AY)
  ctx.lineTo(AX + 80, AY + 36)
  ctx.stroke()

  ctx.textAlign = 'left'
  return c
}