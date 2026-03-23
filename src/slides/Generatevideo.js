// generateVideo.js
// Génère un MP4 TikTok (1080×1920) depuis les 4 slides PNG
// Transitions : flash blanc entre chaque slide
// Durées : 1.5s / 2s / 2s / 2.5s
// Optionnel : musique MP3

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

// Durées en secondes pour chaque slide
const DURATIONS = [1.5, 2.0, 2.0, 2.5]
const FPS       = 30
const FLASH_FRAMES = 3   // nb de frames du flash blanc (≈ 100ms)

let ffmpeg = null

async function loadFFmpeg(onProgress) {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  // Charge les fichiers wasm depuis CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  await ffmpeg.load({
    coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  return ffmpeg
}

// Convertit un blob URL en Uint8Array
async function blobUrlToUint8(blobUrl) {
  const r = await fetch(blobUrl)
  const b = await r.blob()
  return new Uint8Array(await b.arrayBuffer())
}

// Crée une frame de flash blanc (PNG 1080×1920 tout blanc)
function makeWhiteFrame() {
  const c   = document.createElement('canvas')
  c.width   = 1080; c.height = 1920
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1080, 1920)
  return new Promise(res => c.toBlob(b => b.arrayBuffer().then(ab => res(new Uint8Array(ab))), 'image/png'))
}

export async function generateVideo(slideUrls, audioFile, onProgress, onStatus) {
  onStatus?.('Chargement de ffmpeg.wasm…')
  const ff = await loadFFmpeg(onProgress)

  onStatus?.('Préparation des slides…')

  // Écrit les 4 slides PNG dans le système de fichiers ffmpeg
  for (let i = 0; i < slideUrls.length; i++) {
    const data = await blobUrlToUint8(slideUrls[i])
    await ff.writeFile(`slide${i}.png`, data)
  }

  // Écrit le frame de flash blanc
  const whiteData = await makeWhiteFrame()
  await ff.writeFile('white.png', whiteData)

  // Écrit l'audio si fourni
  let hasAudio = false
  if (audioFile) {
    const ab   = await audioFile.arrayBuffer()
    await ff.writeFile('audio.mp3', new Uint8Array(ab))
    hasAudio = true
  }

  onStatus?.('Génération de la vidéo…')

  // ── Construit la commande ffmpeg avec concat + filtergraph
  // Chaque slide = N frames, flash blanc = FLASH_FRAMES entre chaque
  // Format : slide0 → flash → slide1 → flash → slide2 → flash → slide3

  const inputs  = []
  const filters = []
  let   streams = []
  let   idx     = 0

  for (let i = 0; i < 4; i++) {
    const frames = Math.round(DURATIONS[i] * FPS)

    // Input slide (loop sur N frames)
    inputs.push('-loop', '1', '-t', String(DURATIONS[i]), '-i', `slide${i}.png`)
    filters.push(`[${idx}:v]scale=1080:1920,setsar=1,fps=${FPS}[s${i}]`)
    streams.push(`[s${i}]`)
    idx++

    // Flash blanc entre les slides (sauf après la dernière)
    if (i < 3) {
      const flashDur = (FLASH_FRAMES / FPS).toFixed(4)
      inputs.push('-loop', '1', '-t', flashDur, '-i', 'white.png')
      filters.push(`[${idx}:v]scale=1080:1920,setsar=1,fps=${FPS}[f${i}]`)
      streams.push(`[f${i}]`)
      idx++
    }
  }

  // Concat toutes les streams
  const concatIn  = streams.join('')
  const concatN   = streams.length
  filters.push(`${concatIn}concat=n=${concatN}:v=1:a=0[vout]`)

  const filterStr = filters.join('; ')

  // Audio input si présent
  if (hasAudio) inputs.push('-i', 'audio.mp3')

  // Commande finale
  const totalDur = DURATIONS.reduce((a, b) => a + b, 0) + (FLASH_FRAMES / FPS) * 3

  const cmd = [
    ...inputs,
    '-filter_complex', filterStr,
    '-map', '[vout]',
    ...(hasAudio ? ['-map', String(idx) + ':a', '-shortest'] : []),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', hasAudio ? 'aac' : 'copy',
    '-t', String(totalDur),
    '-movflags', '+faststart',
    'output.mp4'
  ]

  await ff.exec(cmd)

  onStatus?.('Lecture du fichier…')
  const data = await ff.readFile('output.mp4')
  const blob = new Blob([data.buffer], { type: 'video/mp4' })
  return URL.createObjectURL(blob)
}