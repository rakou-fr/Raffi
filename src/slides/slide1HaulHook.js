// slide1HaulHook.js
// Slide 1 du carrousel HAUL
// Image de fond depuis dossier local + phrase accrocheuse random
// Format : 1080×1920

const SW = 1080, SH = 1920

const PHRASES = [
  "Meilleur haul\npour l'été 🔥",
  "Haul complet",
  "Haul du mois📦",
  "Mon haul\nde la semaine 🛍️"
]

export async function renderSlide1Haul(backgroundFile, loadImg) {
  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  // ── Fond noir de base
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  // ── Image de fond depuis fichier local
  if (backgroundFile) {
    try {
      const blobUrl = URL.createObjectURL(backgroundFile)
      const img     = await loadImg(blobUrl)
      URL.revokeObjectURL(blobUrl)

      // Cover
      const r  = Math.max(SW / img.width, SH / img.height)
      const dw = img.width  * r
      const dh = img.height * r
      ctx.globalAlpha = 0.65
      ctx.drawImage(img, (SW - dw) / 2, (SH - dh) / 2, dw, dh)
      ctx.globalAlpha = 1
    } catch {}
  }

  // ── Gradient global pour lisibilité
  const g = ctx.createLinearGradient(0, 0, 0, SH)
  g.addColorStop(0,    'rgba(0,0,0,.7)')
  g.addColorStop(0.35, 'rgba(0,0,0,.15)')
  g.addColorStop(0.65, 'rgba(0,0,0,.15)')
  g.addColorStop(1,    'rgba(0,0,0,.92)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SW, SH)

  // ── Accent rouge haut + bas
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, SW, 12)
  ctx.fillRect(0, SH - 12, SW, 12)

  // ── Logo MYCNBOX haut gauche
  ctx.fillStyle = '#ff0000'
  ctx.beginPath(); ctx.roundRect(54, 48, 240, 70, 10); ctx.fill()
  ctx.font      = 'bold 38px Arial Black, Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('MYCNBOX', 174, 96)

  // ── Phrase random — grande, centrée verticalement
  const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
  const lines  = phrase.split('\n')

  ctx.textAlign   = 'left'
  ctx.font        = 'bold 118px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.9)'
  ctx.shadowBlur  = 24

  // Centre vertical
  const lineH  = 134
  const totalH = lines.length * lineH
  let   textY  = (SH - totalH) / 2 + 100

  lines.forEach(line => {
    ctx.fillText(line, 54, textY)
    textY += lineH
  })
  ctx.shadowBlur = 0

  // Ligne rouge décorative sous le texte
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(54, textY + 10, 420, 8)

  // ── CTA bas
  ctx.font      = 'bold 44px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.6)'
  ctx.textAlign = 'center'
  ctx.fillText('SWIPE POUR VOIR LES ARTICLES →', SW / 2, SH - 80)

  ctx.textAlign = 'left'
  return c
}