// Slide 4 — Affiliation MyCNBox
// Prix agent + coupon 30% freight + code affilié + CTA lien en bio
// Format : 1080×1920

const SW = 1080, SH = 1920

const CNY_TO_EUR = 0.127
const USD_TO_CNY = 7.24

function parsePrice(str) {
  const n = parseFloat((str || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export async function renderSlide4(product, options = {}) {
  const { agentPrice = '', affiliateCode = '' } = options

  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  // ── Fond noir total
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, SW, SH)

  // ── Grille décorative subtile
  ctx.strokeStyle = 'rgba(255,0,0,.04)'
  ctx.lineWidth   = 1
  for (let x = 0; x < SW; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SH); ctx.stroke()
  }
  for (let y = 0; y < SH; y += 90) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke()
  }

  // ── Accent rouge haut
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, SW, 14)

  // ── Accent rouge bas
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, SH - 14, SW, 14)

  const cx = SW / 2
  let y    = 80

  // ────────────────────────────────────────
  // HEADER — Agent
  // ────────────────────────────────────────

  // Badge "COMMANDER VIA"
  ctx.font      = 'bold 34px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.35)'
  ctx.textAlign = 'center'
  ctx.fillText('COMMANDER VIA', cx, y + 50); y += 90

  // Nom agent — grand rouge
  ctx.font        = 'bold 110px Arial Black, Arial'
  ctx.fillStyle   = '#ff0000'
  ctx.shadowColor = 'rgba(255,0,0,.4)'
  ctx.shadowBlur  = 30
  ctx.fillText('MYCNBOX', cx, y + 100); y += 130
  ctx.shadowBlur  = 0

  // Sous-ligne décorative
  ctx.fillStyle = 'rgba(255,255,255,.08)'
  ctx.fillRect(54, y, SW - 108, 1); y += 40

  // ────────────────────────────────────────
  // PRIX
  // ────────────────────────────────────────

  // Label
  ctx.font      = 'bold 36px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.fillText('PRIX SUR L\'AGENT', cx, y + 36); y += 70

  if (agentPrice && agentPrice.trim()) {
    // Prix agent saisi manuellement — grand et blanc
    ctx.font        = 'bold 160px Arial Black, Arial'
    ctx.fillStyle   = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,.5)'
    ctx.shadowBlur  = 20
    ctx.fillText(agentPrice, cx, y + 150); y += 185
    ctx.shadowBlur  = 0
  } else {
    // Fallback : prix CNY → EUR
    const cny = parsePrice(product.price || product.toPrice || '0')
    const eur = (cny * CNY_TO_EUR).toFixed(2)
    ctx.font        = 'bold 160px Arial Black, Arial'
    ctx.fillStyle   = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,.5)'
    ctx.shadowBlur  = 20
    ctx.fillText(`≈${eur}€`, cx, y + 150); y += 185
    ctx.shadowBlur  = 0
  }

  // Prix yuan (petit, atténué)
  const cnyStr = product.price?.includes('¥')
    ? product.price
    : `¥${parsePrice(product.toPrice || '0').toFixed(0)}`
  ctx.font      = '42px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.3)'
  ctx.fillText(`Prix source : ${cnyStr}`, cx, y + 10); y += 70

  // Séparateur
  ctx.fillStyle = 'rgba(255,255,255,.08)'
  ctx.fillRect(54, y, SW - 108, 1); y += 50

  // ────────────────────────────────────────
  // COUPON BLOCK
  // ────────────────────────────────────────

  // Fond coupon
  ctx.fillStyle = 'rgba(255,0,0,.08)'
  ctx.beginPath()
  ctx.roundRect(54, y, SW - 108, 200, 16)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,0,0,.3)'
  ctx.lineWidth   = 2
  ctx.stroke()

  // Icône + texte coupon
  ctx.font      = 'bold 36px Arial'
  ctx.fillStyle = '#ff0000'
  ctx.fillText('🎁  COUPON DISPONIBLE', cx, y + 58)

  ctx.font      = 'bold 58px Arial Black, Arial'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('-30% FREIGHT DROP', cx, y + 130)

  ctx.font      = '32px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.fillText('sur les frais de livraison · via lien en bio', cx, y + 178)

  y += 240

  // ────────────────────────────────────────
  // CODE AFFILIÉ
  // ────────────────────────────────────────
  if (affiliateCode && affiliateCode.trim()) {
    ctx.font      = 'bold 36px Arial'
    ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.fillText('UTILISE LE CODE', cx, y + 36); y += 60

    // Fond code
    ctx.fillStyle = 'rgba(255,255,255,.06)'
    ctx.beginPath()
    ctx.roundRect(54, y, SW - 108, 100, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.15)'
    ctx.lineWidth   = 2
    ctx.stroke()

    ctx.font        = 'bold 68px Arial Black, Arial'
    ctx.fillStyle   = '#ffcc00'
    ctx.shadowColor = 'rgba(255,200,0,.3)'
    ctx.shadowBlur  = 16
    ctx.fillText(affiliateCode.toUpperCase(), cx, y + 72)
    ctx.shadowBlur  = 0
    y += 140
  } else {
    y += 30
  }

  // ────────────────────────────────────────
  // CTA — Lien en bio
  // ────────────────────────────────────────

  // Grand bouton rouge
  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.roundRect(54, y, SW - 108, 110, 16)
  ctx.fill()

  ctx.font        = 'bold 52px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.3)'
  ctx.shadowBlur  = 8
  ctx.fillText('↓  LIEN EN BIO  ↓', cx, y + 72)
  ctx.shadowBlur  = 0

  y += 140

  // Sous-texte
  ctx.font      = '32px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.3)'
  ctx.fillText('Commander sur MyCNBox · Livraison mondiale', cx, y + 20)

  ctx.textAlign = 'left'
  return c
}