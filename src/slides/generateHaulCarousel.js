// generateHaulCarousel.js
// Génère le carrousel HAUL (4 slides globales avec articles random)

import { renderSlide1Haul  } from './slide1HaulHook.js'
import { renderSlide2Haul  } from './slide2HaulQC.js'
import { renderSlide3Haul  } from './slide3HaulPrices.js'
import { renderSlide4Haul  } from './slide4HaulCTA.js'

// loadImg simplifié — charge directement sans proxy (les QC sont sur cdn.findqc.com)
export function loadImgHaul(src) {
  if (!src || src === 'undefined') return Promise.reject(new Error('src invalide'))
  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => rej(new Error('img fail: ' + src))
    img.src = src
  })
}

function canvasToBlob(canvas) {
  return new Promise(res => canvas.toBlob(res, 'image/png'))
}

// Sélectionne N articles aléatoires parmi la liste
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export async function generateHaulCarousel(allArticles, backgroundFile, affiliateCode = '') {
  // Prend 4 articles random qui ont des QC
  const withQc  = allArticles.filter(a => a._qcUrls?.length > 0 || a.qcPicCnt > 0)
  const picked  = pickRandom(withQc.length >= 4 ? withQc : allArticles, 4)

  // Prépare les données pour chaque slide
  const slide2Articles = picked.map(a => ({
    qcUrl: a._qcUrls?.[0] || a.pic,
    title: a.title,
  }))

  const slide3Articles = picked.map(a => ({
    picUrl: `/image?url=${encodeURIComponent(a.pic || '')}`,
    title:  a.title,
    price:  a.price,
    toPrice: a.toPrice,
  }))

  // Génère les 4 slides en parallèle
  const [c1, c2, c3, c4] = await Promise.all([
    renderSlide1Haul(backgroundFile, loadImgHaul),
    renderSlide2Haul(slide2Articles, loadImgHaul),
    renderSlide3Haul(slide3Articles, (src) => {
      // Pour les images produit on passe par le proxy Express
      const proxied = src.startsWith('/image') ? src : `/image?url=${encodeURIComponent(src)}`
      return loadImgHaul(proxied)
    }),
    renderSlide4Haul(affiliateCode),
  ])

  const blobs = await Promise.all([c1, c2, c3, c4].map(canvasToBlob))
  return blobs.map(b => URL.createObjectURL(b))
}

export function downloadHaulCarousel(slideUrls) {
  const names = ['haul_1_hook', 'haul_2_qc', 'haul_3_prix', 'haul_4_cta']
  slideUrls.forEach((url, i) => {
    const a = document.createElement('a')
    a.href     = url
    a.download = `${names[i]}.png`
    a.click()
  })
}