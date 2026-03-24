import { useState } from 'react'
import { Spinner }   from './Spinner.jsx'
import { downloadCarousel } from '../slides/generateCarousel.js'

// Proxy toutes les images externes via Express pour éviter le CORS
const proxyUrl = (src) => src ? `/image?url=${encodeURIComponent(src)}` : ''

// Labels des 4 slides
const SLIDE_LABELS = ['Hook', 'QC 1', 'QC 2', 'Prix']

export function ArticleCard({ item, onGenerate, generating }) {
  const [slideIdx, setSlideIdx] = useState(0)

  const isLoading = generating === 'loading'
  const isDone    = generating === 'done'
  const slides    = item._slides || []
  const hasSlides = slides.length === 4

  const prev = () => setSlideIdx(i => (i - 1 + 4) % 4)
  const next = () => setSlideIdx(i => (i + 1) % 4)

  return (
    <div className={[
      'rounded-xl border flex flex-col overflow-hidden transition-all duration-200',
      isDone
        ? 'border-emerald-500/25 bg-emerald-500/3'
        : 'border-white/6 bg-white/[0.02] hover:border-white/12',
    ].join(' ')}>

      {/* ── Aperçu image ── */}
      <div className="relative w-full aspect-[9/16] bg-black overflow-hidden">

        {/* Image principale ou slide sélectionnée */}
        {hasSlides ? (
          <>
            <img
              src={slides[slideIdx]}
              alt=""
              className="w-full h-full object-cover transition-opacity duration-200"
            />

            {/* Indicateurs de slides */}
            <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
              {SLIDE_LABELS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  className={[
                    'h-0.5 rounded-full transition-all duration-200',
                    i === slideIdx ? 'w-6 bg-white' : 'w-2 bg-white/30',
                  ].join(' ')}
                />
              ))}
            </div>

            {/* Label slide courante */}
            <div className="absolute top-4 right-2 bg-black/60 backdrop-blur-sm text-[9px] text-white/70 px-1.5 py-0.5 rounded tracking-wide uppercase">
              {SLIDE_LABELS[slideIdx]}
            </div>

            {/* Flèches navigation */}
            {slideIdx > 0 && (
              <button
                onClick={prev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center text-xs hover:bg-black/70 transition-all"
              >
                ‹
              </button>
            )}
            {slideIdx < 3 && (
              <button
                onClick={next}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center text-xs hover:bg-black/70 transition-all"
              >
                ›
              </button>
            )}
          </>
        ) : (
          <>
            <img
              src={item.pic}
              alt=""
              className="w-full h-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            {/* Overlay génération en cours */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Spinner size={24} />
                <span className="text-xs text-white/60">Génération…</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Infos + actions ── */}
      <div className="p-3 flex flex-col gap-2.5">

        {/* Titre + meta */}
        <div>
          <p className="text-xs font-semibold text-white/80 line-clamp-2 leading-snug mb-1.5">
            {item.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-orange-400">{item.price}</span>
            <span className="text-[10px] text-white/20">#{item.id}</span>
            <span className="text-[10px] px-1.5 py-px rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {item.qcPicCnt} QC
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isDone && (
            <button
              onClick={() => onGenerate(item)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold
                bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white transition-all active:scale-95"
            >
              {isLoading ? <><Spinner size={11} /> Génération…</> : '⚡ Générer'}
            </button>
          )}

          {isDone && (
            <>
              <button
                onClick={() => downloadCarousel(slides, item.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold
                  bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
              >
                ⬇ Télécharger
              </button>
              <button
                onClick={() => { setSlideIdx(0); onGenerate(item) }}
                className="px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 border border-white/8 hover:border-white/20 transition-all"
                title="Regénérer"
              >
                ↺
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}