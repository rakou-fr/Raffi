// HaulCarousel.jsx
// Section "Carrousel HAUL" dans l'interface
// Génère 4 slides globales avec articles random

import { useState, useRef } from 'react'
import { generateHaulCarousel, downloadHaulCarousel } from '../slides/generateHaulCarousel.js'
import { Spinner } from './Spinner.jsx'

const SLIDE_LABELS = ['Hook', 'QC Grid', 'Prix', 'Bio']

export function HaulCarousel({ articles, affiliateCode }) {
  const [slides,    setSlides]    = useState([])
  const [slideIdx,  setSlideIdx]  = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [bgFile,    setBgFile]    = useState(null)
  const [bgPreview, setBgPreview] = useState(null)
  const bgRef = useRef(null)

  const handleBgChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBgFile(file)
    setBgPreview(URL.createObjectURL(file))
  }

  const handleGenerate = async () => {
    if (!articles.length) return
    setLoading(true)
    setError('')
    setSlides([])
    setSlideIdx(0)

    try {
      // Fetch les QC des articles si pas encore chargés
      const urls = await generateHaulCarousel(articles, bgFile, affiliateCode)
      setSlides(urls)
    } catch (e) {
      console.error('[haul]', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const hasDone = slides.length === 4

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-white/8 bg-white/[0.02]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white/80">Carrousel Haul</h3>
          <p className="text-[11px] text-white/30 mt-0.5">
            4 slides globales · {articles.length} articles disponibles
          </p>
        </div>
        {hasDone && (
          <button
            onClick={() => downloadHaulCarousel(slides)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              bg-emerald-500/15 text-emerald-400 border border-emerald-500/30
              hover:bg-emerald-500/25 transition-all active:scale-95"
          >
            ⬇ Télécharger
          </button>
        )}
      </div>

      <div className="flex gap-4">

        {/* Config */}
        <div className="flex flex-col gap-3 flex-shrink-0 w-48">

          {/* Image de fond */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-white/30 mb-1.5">Image de fond (slide 1)</p>
            <button
              onClick={() => bgRef.current?.click()}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-white/15
                hover:border-white/30 transition-colors overflow-hidden relative
                flex items-center justify-center bg-white/3"
            >
              {bgPreview
                ? <img src={bgPreview} alt="" className="w-full h-full object-cover absolute inset-0" />
                : <span className="text-[10px] text-white/25 text-center px-2">Cliquer pour<br/>choisir une image</span>
              }
            </button>
            <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
          </div>

          {/* Bouton générer */}
          <button
            onClick={handleGenerate}
            disabled={loading || !articles.length}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold
              bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white transition-all active:scale-95"
          >
            {loading ? <><Spinner size={12} /> Génération…</> : '⚡ Générer le haul'}
          </button>

          {error && (
            <p className="text-[10px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg p-2">
              ⚠ {error}
            </p>
          )}

          {/* Regénérer */}
          {hasDone && (
            <button
              onClick={handleGenerate}
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors text-center"
            >
              ↺ Regénérer (articles différents)
            </button>
          )}
        </div>

        {/* Preview slide */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Slide preview */}
          <div className="relative w-full overflow-hidden rounded-xl bg-black"
            style={{ aspectRatio: '9/16', maxHeight: 380 }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Spinner size={28} />
              </div>
            )}
            {hasDone && (
              <>
                <img
                  src={slides[slideIdx]}
                  alt=""
                  className="w-full h-full object-contain"
                />
                {/* Flèches */}
                {slideIdx > 0 && (
                  <button onClick={() => setSlideIdx(i => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80">
                    ‹
                  </button>
                )}
                {slideIdx < 3 && (
                  <button onClick={() => setSlideIdx(i => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80">
                    ›
                  </button>
                )}
              </>
            )}
            {!hasDone && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/15 text-xs text-center px-4">
                Génère le carrousel pour voir l'aperçu
              </div>
            )}
          </div>

          {/* Dots */}
          {hasDone && (
            <div className="flex justify-center gap-1.5">
              {SLIDE_LABELS.map((label, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  className="flex flex-col items-center gap-0.5 group">
                  <span className={`block h-0.5 rounded-full transition-all duration-200 ${
                    i === slideIdx ? 'w-8 bg-red-500' : 'w-3 bg-white/20 group-hover:bg-white/40'
                  }`} />
                  <span className={`text-[8px] uppercase tracking-wide ${
                    i === slideIdx ? 'text-white/60' : 'text-white/20'
                  }`}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}