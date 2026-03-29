const SW = 1080, SH = 1920

export async function renderSlide4Haul(affiliateCode = '') {
  const c = document.createElement('canvas')
  c.width = SW
  c.height = SH
  const ctx = c.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, SW, SH)

  const cx = SW / 2

  // Top brand
  ctx.fillStyle = '#ff0000'
  ctx.font = 'bold 58px Arial Black, Arial'
  ctx.textAlign = 'center'
  ctx.fillText('MYCNBOX', cx, 140)

  // Main message (focus max)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 110px Arial Black, Arial'
  ctx.fillText('SPREADSHEET', cx, 760)

  ctx.fillStyle = '#ff0000'
  ctx.fillText('EN BIO', cx, 880)

  // Subtext
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '42px Arial'
  ctx.fillText('Tous les articles + liens', cx, 980)

  // Affiliate code (clean block)
  if (affiliateCode?.trim()) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(cx - 260, 1100, 520, 120)

    ctx.strokeStyle = 'rgba(255,0,0,0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(cx - 260, 1100, 520, 120)

    ctx.fillStyle = '#ffffff'
    ctx.font = '28px Arial'
    ctx.fillText('CODE', cx, 1140)

    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 64px Arial Black, Arial'
    ctx.fillText(affiliateCode.toUpperCase(), cx, 1195)
  }

  // CTA button (ultra clean)
  const BTN_Y = SH - 260

  ctx.fillStyle = '#ff0000'
  ctx.fillRect(120, BTN_Y, SW - 240, 100)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px Arial Black, Arial'
  ctx.fillText('LIEN EN BIO', cx, BTN_Y + 65)

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.font = '30px Arial'
  ctx.fillText('Commande rapide · Livraison', cx, SH - 80)

  return c
}