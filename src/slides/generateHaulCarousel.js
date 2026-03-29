// generateHaulCarousel.js — Orchestre les 4 slides Haul

import { renderSlide1Haul } from './slide1HaulHook.js'
import { renderSlide2Haul } from './slide2HaulQC.js'
import { renderSlide3Haul } from './slide3HaulQC.js'
import { renderSlide4Haul } from './slide4HaulCTA.js'

// Charge une image (dataUrl, cdn.findqc.com direct, autres via proxy)
export function loadImg(src) {
  if (!src || src === 'undefined') return Promise.reject(new Error('src invalide'))
  // dataUrl ou cdn.findqc.com → direct
  // autres → proxy Express
  const direct = src.startsWith('data:') || src.includes('cdn.findqc.com')
  const url    = direct ? src : `/image?url=${encodeURIComponent(src)}`

  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => {
      if (direct && !src.startsWith('data:')) {
        const img2 = new Image()
        img2.crossOrigin = 'anonymous'
        img2.onload  = () => res(img2)
        img2.onerror = () => rej(new Error('img fail: ' + src))
        img2.src = `/image?url=${encodeURIComponent(src)}`
      } else {
        rej(new Error('img fail: ' + src))
      }
    }
    img.src = url
  })
}

function canvasToBlob(c) {
  return new Promise(res => c.toBlob(res, 'image/png'))
}

export async function generateHaulCarousel(articles, bgDataUrl, affiliateCode = '') {
  // articles = 4 articles avec { qcUrls, picUrl, title, price }
  const [c1, c2, c3, c4] = await Promise.all([
    renderSlide1Haul(bgDataUrl, loadImg),
    renderSlide2Haul(articles, loadImg),
    renderSlide3Haul(articles, loadImg),
    renderSlide4Haul(affiliateCode),
  ])

  const blobs = await Promise.all([c1, c2, c3, c4].map(canvasToBlob))
  return blobs.map(b => URL.createObjectURL(b))
}

export function downloadHaulCarousel(slideUrls, id) {
  const names = ['slide_1_hook', 'slide_2_qc_a', 'slide_3_qc_b', 'slide_4_bio']
  slideUrls.forEach((url, i) => {
    const a = document.createElement('a')
    a.href = url; a.download = `carousel_${id}__${names[i]}.png`; a.click()
  })
}