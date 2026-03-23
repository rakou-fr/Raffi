// generateCarousel.js
// Orchestre la génération des 4 slides et retourne des blob URLs

import { renderSlide1 } from './slide1Hooks.js'
import { renderSlide2 } from './slide2QC.js'
import { renderSlide3 } from './slide3QC.js'
import { renderSlide4 } from './slide4Price.js'

// Charge une image — les QC viennent de cdn.findqc.com (public, CORS ok)
// Les images produit passent par /image pour éviter les restrictions CORS canvas
export function loadImg(src) {
  if (!src || src === 'undefined') return Promise.reject(new Error('src invalide'))

  // cdn.findqc.com supporte CORS → chargement direct
  // Autres domaines (alicdn, geilicdn) → via proxy Express
  const isCdnFindqc = src.includes('cdn.findqc.com')
  const url = isCdnFindqc ? src : `/image?url=${encodeURIComponent(src)}`

  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => {
      // Fallback : si direct échoue, tente le proxy
      if (isCdnFindqc) {
        const img2 = new Image()
        img2.crossOrigin = 'anonymous'
        img2.onload  = () => res(img2)
        img2.onerror = () => rej(new Error(`img fail: ${src}`))
        img2.src = `/image?url=${encodeURIComponent(src)}`
      } else {
        rej(new Error(`img fail: ${src}`))
      }
    }
    img.src = url
  })
}

function canvasToBlob(canvas) {
  return new Promise(res => canvas.toBlob(res, 'image/png'))
}

export async function generateCarousel(product, qcUrls, options = {}) {
  const qc1 = qcUrls[0] || product.pic
  const qc2 = qcUrls[1] || qcUrls[0] || product.pic

  const productWithFallback = { ...product, _fallbackPic: qc1 }

  const [c1, c2, c3, c4] = await Promise.all([
    renderSlide1(productWithFallback, loadImg),
    renderSlide2(qc1, loadImg),
    renderSlide3(qc2, loadImg),
    renderSlide4(product, options),
  ])

  const blobs = await Promise.all([c1, c2, c3, c4].map(canvasToBlob))
  return blobs.map(b => URL.createObjectURL(b))
}

export function downloadCarousel(slideUrls, id) {
  const names = ['slide_1_hook', 'slide_2_qc1', 'slide_3_qc2', 'slide_4_price']
  slideUrls.forEach((url, i) => {
    const a = document.createElement('a')
    a.href     = url
    a.download = `carousel_${id}__${names[i]}.png`
    a.click()
  })
}