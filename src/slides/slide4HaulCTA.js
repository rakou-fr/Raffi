// slide4HaulCTA.js
// Slide 4 du carrousel HAUL
// "Le spreadsheet est en bio" + branding MYCNBOX
// Format : 1080×1920

const SW = 1080, SH = 1920

export async function renderSlide4Haul(affiliateCode = '') {
  const c   = document.createElement('canvas')
  c.width   = SW; c.height = SH
  const ctx = c.getContext('2d')

  // ── Fond noir
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, SW, SH)

  // Grille décorative
  ctx.strokeStyle = 'rgba(255,0,0,.04)'
  ctx.lineWidth   = 1
  for (let x = 0; x < SW; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SH); ctx.stroke() }
  for (let y = 0; y < SH; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke() }

  // Accents rouge
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(0, 0, SW, 14)
  ctx.fillRect(0, SH - 14, SW, 14)

  const cx = SW / 2

  // ── MYCNBOX logo zone
  ctx.fillStyle = '#ff0000'
  ctx.beginPath(); ctx.roundRect(cx - 230, 80, 460, 100, 14); ctx.fill()
  ctx.font      = 'bold 62px Arial Black, Arial'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('MYCNBOX', cx, 152)

  // ── Icône spreadsheet (emoji)
  ctx.font      = '200px Arial'
  ctx.fillText('📊', cx - 100, 560)

  // ── Texte principal
  ctx.font        = 'bold 108px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.6)'
  ctx.shadowBlur  = 20
  ctx.fillText('LE', cx, 720)
  ctx.fillText('SPREADSHEET', cx, 840)

  ctx.font      = 'bold 108px Arial Black, Arial'
  ctx.fillStyle = '#ff0000'
  ctx.fillText('EST EN BIO', cx, 960)
  ctx.shadowBlur = 0

  // Ligne déco
  ctx.fillStyle = 'rgba(255,255,255,.08)'
  ctx.fillRect(100, 1010, SW - 200, 2)

  // ── Sous-texte
  ctx.font      = '44px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.5)'
  ctx.fillText('Tous les articles + liens directs', cx, 1090)
  ctx.fillText('Commander via mon lien agent', cx, 1148)

  // ── Code affilié si dispo
  if (affiliateCode?.trim()) {
    ctx.font      = 'bold 38px Arial'
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.fillText('CODE DE RÉDUCTION', cx, 1260)

    ctx.fillStyle = 'rgba(255,255,255,.07)'
    ctx.beginPath(); ctx.roundRect(cx - 220, 1282, 440, 96, 12); ctx.fill()
    ctx.strokeStyle = 'rgba(255,204,0,.3)'; ctx.lineWidth = 2; ctx.stroke()

    ctx.font        = 'bold 64px Arial Black, Arial'
    ctx.fillStyle   = '#ffcc00'
    ctx.shadowColor = 'rgba(255,200,0,.3)'
    ctx.shadowBlur  = 16
    ctx.fillText(affiliateCode.toUpperCase(), cx, 1348)
    ctx.shadowBlur  = 0
  }

  // ── Gros bouton CTA
  const BTN_Y = SH - 280
  ctx.fillStyle = '#ff0000'
  ctx.beginPath(); ctx.roundRect(60, BTN_Y, SW - 120, 110, 16); ctx.fill()

  ctx.font        = 'bold 54px Arial Black, Arial'
  ctx.fillStyle   = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,.3)'
  ctx.shadowBlur  = 8
  ctx.fillText('↓  LIEN EN BIO  ↓', cx, BTN_Y + 72)
  ctx.shadowBlur  = 0

  ctx.font      = '32px Arial'
  ctx.fillStyle = 'rgba(255,255,255,.3)'
  ctx.fillText('Commander · Livraison mondiale', cx, SH - 100)

  ctx.textAlign = 'left'
  return c
}