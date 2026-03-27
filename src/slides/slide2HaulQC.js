// slide2HaulQC.js
// Slide 2 du carrousel HAUL
// Grille 2x2 de photos QC de 4 articles différents
// Format : 1080×1920

const SW = 1080, SH = 1920
const GAP = 12   // espace entre les cellules

export async function renderSlide2Haul(articles, loadImg) {
  // articles = array de { qcUrl, title }
  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  // ── Header
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, SW, 12)

  ctx.font      = 'bold 52px Arial Black, Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.fillText('QUALITY CHECK', 54, 100)

  ctx.font      = 'bold 36px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.fillText('Photos réelles des articles', 54, 148)

  // ── Grille 2x2
  const GRID_TOP  = 180
  const CELL_W    = (SW - GAP * 3) / 2         // 2 colonnes
  const CELL_H    = (SH - GRID_TOP - GAP * 3 - 120) / 2  // 2 lignes, laisse 120px pour footer

  for (let i = 0; i < Math.min(4, articles.length); i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x   = GAP + col * (CELL_W + GAP)
    const y   = GRID_TOP + GAP + row * (CELL_H + GAP)

    // Fond cellule
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x, y, CELL_W, CELL_H)

    // Image QC
    try {
      const img   = await loadImg(articles[i].qcUrl)
      // Contain dans la cellule
      const scale = Math.min(CELL_W / img.width, CELL_H / img.height)
      const dw    = img.width  * scale
      const dh    = img.height * scale
      const dx    = x + (CELL_W - dw) / 2
      const dy    = y + (CELL_H - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
    } catch {}

    // Numéro cellule
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    ctx.beginPath(); ctx.roundRect(x + 10, y + 10, 54, 54, 8); ctx.fill()
    ctx.font      = 'bold 32px Arial Black, Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(String(i + 1), x + 37, y + 47)
  }

  // ── Footer
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, SH - 12, SW, 12)

  ctx.font      = 'bold 36px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.5)'
  ctx.textAlign = 'center'
  ctx.fillText('SWIPE POUR LES PRIX →', SW / 2, SH - 46)

  ctx.textAlign = 'left'
  return c
}