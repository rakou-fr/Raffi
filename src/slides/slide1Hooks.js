// Slide 1 — Hook
// CNBOX FINDS #XXX + image produit + prix ¥/€ + logo MYCNBOX + CTA swipe
// Format : 1080×1920

const SW = 1080, SH = 1920

// Taux de change fixes
const CNY_TO_EUR = 0.127   // 1 CNY ≈ 0.127 EUR
const USD_TO_CNY = 7.24    // pour fallback si on a que du USD

function parsePrice(priceStr) {
  // Gère "¥70.00", "$10.14", etc.
  const n = parseFloat((priceStr || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 2) {
  const words = text.split(' ')
  let line = '', lines = []
  for (const w of words) {
    const t = line + w + ' '
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line.trim())
      line = w + ' '
      if (lines.length >= maxLines) break
    } else {
      line = t
    }
  }
  if (lines.length < maxLines) lines.push(line.trim())
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lh))
}

export async function renderSlide1(product, loadImg) {
  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  // ── Fond noir
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  // ── Image produit (zone centrale)
  const IMG_Y = 310
  const IMG_H = Math.round(SH * 0.52)
  const picSrc = product.pic || product._fallbackPic

  try {
    let img
    try { img = await loadImg(picSrc) }
    catch {
      if (product._fallbackPic && product._fallbackPic !== picSrc)
        img = await loadImg(product._fallbackPic)
      else throw new Error('no img')
    }
    const r  = Math.max(SW / img.width, IMG_H / img.height)
    const dw = img.width * r
    const dh = img.height * r
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, IMG_Y, SW, IMG_H)
    ctx.clip()
    ctx.globalAlpha = 0.88
    ctx.drawImage(img, (SW - dw) / 2, IMG_Y + (IMG_H - dh) / 2, dw, dh)
    ctx.globalAlpha = 1
    ctx.restore()
  } catch {}

  // ── Gradient haut → noir
  const gTop = ctx.createLinearGradient(0, 0, 0, IMG_Y + 200)
  gTop.addColorStop(0,   'rgba(0,0,0,1)')
  gTop.addColorStop(0.6, 'rgba(0,0,0,0)')
  ctx.fillStyle = gTop
  ctx.fillRect(0, 0, SW, IMG_Y + 200)

  // ── Gradient bas → noir
  const gBot = ctx.createLinearGradient(0, IMG_Y + IMG_H - 300, 0, SH)
  gBot.addColorStop(0, 'rgba(0,0,0,0)')
  gBot.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = gBot
  ctx.fillRect(0, IMG_Y + IMG_H - 300, SW, SH - (IMG_Y + IMG_H - 300))

  // ────────────────────────────────────────
  // HEADER
  // ────────────────────────────────────────

  // Logo MYCNBOX (haut gauche)
  try {
    const logo = await loadImg('https://i.imgur.com/placeholder.png') // remplace par ton vrai logo URL
    ctx.drawImage(logo, 54, 44, 130, 130)
  } catch {
    // Fallback : badge texte rouge
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.roundRect(54, 54, 220, 64, 8)
    ctx.fill()
    ctx.font      = 'bold 36px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText('MYCNBOX', 164, 97)
  }

  // "CNBOX FINDS" — ligne 1
  ctx.textAlign   = 'left'
  ctx.font        = 'bold 100px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.7)'
  ctx.shadowBlur  = 16
  ctx.fillText('CNBOX FINDS', 54, 210)

  // Numéro random — ligne 2, rouge
  const num = Math.floor(Math.random() * (1000 - 20 + 1)) + 20
  ctx.font      = 'bold 100px Arial Black, Arial'
  ctx.fillStyle = '#ff0000'
  ctx.fillText(`#${String(num).padStart(3, '0')}`, 54, 308)
  ctx.shadowBlur = 0

  // Ligne décorative rouge
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(54, 320, 360, 7)

  // ────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────

  // Titre produit (2 lignes max)
  ctx.font        = '44px Arial'
  ctx.fillStyle   = 'rgba(255,255,255,.8)'
  ctx.shadowColor = 'rgba(0,0,0,.9)'
  ctx.shadowBlur  = 10
  wrapText(ctx, product.title, 54, SH - 560, SW - 108, 56, 2)
  ctx.shadowBlur = 0

  // Séparateur
  ctx.fillStyle = 'rgba(255,255,255,.12)'
  ctx.fillRect(54, SH - 460, SW - 108, 1)

  // Prix ¥ — vient de product.price qui est toujours en CNY (¥XX.XX)
  const cnyRaw = product.price || ''
  const cnyNum = parsePrice(cnyRaw)   // valeur numérique en CNY
  const cnyVal = cnyRaw.includes('¥') ? cnyRaw : `¥${cnyNum.toFixed(0)}`
  ctx.font      = 'bold 52px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.45)'
  ctx.fillText(cnyVal, 54, SH - 390)

  // Prix € = CNY × CNY_TO_EUR
  const eurVal  = (cnyNum * CNY_TO_EUR).toFixed(2)
  ctx.font        = 'bold 128px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.6)'
  ctx.shadowBlur  = 14
  ctx.fillText(`≈${eurVal}€`, 54, SH - 240)
  ctx.shadowBlur = 0

  // Disclaimer
  ctx.font      = '28px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.25)'
  ctx.fillText('prix estimé · hors frais de livraison', 54, SH - 185)

  // CTA bouton rouge
  const BTN_Y = SH - 148
  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.roundRect(54, BTN_Y, SW - 108, 88, 14)
  ctx.fill()

  ctx.font      = 'bold 40px Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('VOIR LES PHOTOS QC  →', SW / 2, BTN_Y + 56)

  ctx.textAlign = 'left'
  return c
}