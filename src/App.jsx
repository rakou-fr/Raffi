import { useState, useEffect, useRef } from 'react'
import { generateHaulCarousel, downloadHaulCarousel } from './slides/generateHaulCarousel.js'

// ─── Composants UI ────────────────────────────────────────

function Spinner({ size = 14 }) {
  return (
    <span style={{ width: size, height: size }}
      className="inline-block rounded-full border-2 border-white/15 border-t-white animate-spin flex-shrink-0" />
  )
}

function StatusDot({ state }) {
  const cfg = {
    idle:     'bg-white/20',
    starting: 'bg-yellow-400 animate-pulse shadow-[0_0_6px_#facc15]',
    ready:    'bg-emerald-400 shadow-[0_0_6px_#34d399]',
    error:    'bg-red-500',
    stopping: 'bg-yellow-400 animate-pulse',
  }
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg[state] || cfg.idle}`} />
}

// Slide preview mini (9:16)
function SlideThumb({ url, label, onClick, selected }) {
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
      <div className={`rounded-lg overflow-hidden border-2 transition-all ${selected ? 'border-red-500' : 'border-white/10 hover:border-white/30'}`}
        style={{ width: 72, height: 128 }}>
        {url
          ? <img src={url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Spinner size={16} /></div>
        }
      </div>
      <span className="text-[8px] text-white/30 uppercase tracking-wide">{label}</span>
    </div>
  )
}

// Carte carrousel dans la galerie
function CarouselCard({ carousel, onDelete }) {
  const [slideIdx, setSlideIdx] = useState(0)
  const labels = ['Hook', 'QC A', 'QC B', 'Bio']

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden flex flex-col">
      {/* Preview principale */}
      <div className="relative bg-black overflow-hidden" style={{ aspectRatio: '9/16' }}>
        {carousel.slides?.[slideIdx]
          ? <img src={carousel.slides[slideIdx]} alt="" className="w-full h-full object-contain" />
          : <div className="w-full h-full flex items-center justify-center">
              {carousel.generating
                ? <div className="flex flex-col items-center gap-2"><Spinner size={24} /><span className="text-xs text-white/30">Génération…</span></div>
                : <span className="text-white/15 text-xs">En attente</span>
              }
            </div>
        }
        {/* Indicateurs */}
        {carousel.slides?.length === 4 && (
          <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
            {labels.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className={`h-0.5 rounded-full transition-all ${i === slideIdx ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} />
            ))}
          </div>
        )}
        {/* Flèches */}
        {carousel.slides?.length === 4 && slideIdx > 0 && (
          <button onClick={() => setSlideIdx(i => i - 1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center">‹</button>
        )}
        {carousel.slides?.length === 4 && slideIdx < 3 && (
          <button onClick={() => setSlideIdx(i => i + 1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center">›</button>
        )}
      </div>

      {/* Actions */}
      <div className="p-2.5 flex flex-col gap-2">
        <p className="text-[10px] text-white/30 truncate">#{carousel.id.split('_')[0]}</p>
        <div className="flex gap-1.5">
          {carousel.slides?.length === 4 && (
            <button onClick={() => downloadHaulCarousel(carousel.slides, carousel.id)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all active:scale-95">
              ⬇ DL
            </button>
          )}
          <button onClick={() => onDelete(carousel.id)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] text-white/25 hover:text-red-400 border border-white/8 hover:border-red-500/30 transition-all">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App principale ────────────────────────────────────────
export default function App() {
  const [engineState,    setEngineState]    = useState('idle')
  const [affiliateCode,  setAffiliateCode]  = useState('')
  const [batchCount,     setBatchCount]     = useState(5)
  const [batchState,     setBatchState]     = useState({ running: false, done: 0, total: 0, error: '' })
  const [carousels,      setCarousels]      = useState([])   // { id, articles, slides, generating }
  const [bgCount,        setBgCount]        = useState(0)
  const [error,          setError]          = useState('')
  const pollRef = useRef(null)

  // Poll status engine + batch
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch('/status')
        const d = await r.json()
        setEngineState(d.state)
      } catch {}
    }, 1500)
    return () => clearInterval(id)
  }, [])

  // Charge la liste des carrousels sauvegardés au démarrage
  useEffect(() => {
    loadCarousels()
    loadBgCount()
  }, [])

  const loadCarousels = async () => {
    try {
      const r = await fetch('/carousels')
      const d = await r.json()
      // Carrousels serveur (déjà générés dans des sessions précédentes)
      // On les affiche sans slides (pas en mémoire)
      setCarousels(prev => {
        const serverIds = new Set(d.carousels.map(c => c.id))
        const existing  = prev.filter(c => serverIds.has(c.id))
        const newOnes   = d.carousels
          .filter(c => !prev.find(p => p.id === c.id))
          .map(c => ({ ...c, slides: null, generating: false }))
        return [...existing, ...newOnes]
      })
    } catch {}
  }

  const loadBgCount = async () => {
    try {
      const r = await fetch('/backgrounds')
      const d = await r.json()
      setBgCount(d.count || 0)
    } catch {}
  }

  // ── Start / Stop Puppeteer
  const handleStart = async () => {
    setError('')
    setEngineState('starting')
    const r = await fetch('/start', { method: 'POST' })
    const d = await r.json()
    if (!d.ok) { setError(d.error); setEngineState('error') }
  }

  const handleStop = async () => {
    await fetch('/stop', { method: 'POST' })
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  // ── Lance le batch
  const handleStartBatch = async () => {
    if (batchState.running) return
    setError('')

    const r = await fetch('/batch/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: batchCount }),
    })
    const d = await r.json()
    if (!d.ok) { setError(d.error); return }

    setBatchState({ running: true, done: 0, total: batchCount, error: '' })

    // Poll le batch et génère les slides canvas au fur et à mesure
    pollRef.current = setInterval(() => pollBatch(), 800)
  }

  const handleStopBatch = async () => {
    await fetch('/batch/stop', { method: 'POST' })
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setBatchState(s => ({ ...s, running: false }))
  }

  const pollBatch = async () => {
    try {
      const r = await fetch('/batch/status')
      const d = await r.json()
      setBatchState({ running: d.running, done: d.done, total: d.total, error: d.error || '' })

      // Traite les nouveaux résultats
      if (d.results?.length > 0) {
        d.results.forEach(result => {
          setCarousels(prev => {
            // check dans le state réel
            if (prev.find(c => c.id === result.id)) return prev
      
            // ajoute UNE seule fois
            generateSlides(result.id, result.articles)
      
            return [...prev, {
              id: result.id,
              articles: result.articles,
              slides: null,
              generating: true
            }]
          })
        })
      }

      if (!d.running && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    } catch {}
  }

  // Génère les 4 slides canvas pour un carrousel
  const generateSlides = async (id, articles) => {
    try {
      // Récupère une background random depuis le serveur
      const bgRes = await fetch('/background/random')
      const bgData = bgRes.ok ? await bgRes.json() : {}
      const bgDataUrl = bgData.dataUrl || null

      const slides = await generateHaulCarousel(articles, bgDataUrl, affiliateCode)

      setCarousels(prev => prev.map(c =>
        c.id === id ? { ...c, slides, generating: false } : c
      ))
    } catch (e) {
      console.error('[generate]', e)
      setCarousels(prev => prev.map(c =>
        c.id === id ? { ...c, generating: false } : c
      ))
    }
  }

  // Supprime un carrousel
  const handleDelete = async (id) => {
    await fetch(`/carousels/${id}`, { method: 'DELETE' })
    setCarousels(prev => prev.filter(c => c.id !== id))
  }

  // Télécharge tout
  const handleDownloadAll = () => {
    carousels.forEach(c => {
      if (c.slides?.length === 4) downloadHaulCarousel(c.slides, c.id)
    })
  }

  const isReady    = engineState === 'ready'
  const doneCount  = carousels.filter(c => c.slides?.length === 4).length

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── HEADER ── */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-red-500 font-black tracking-[3px] text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          MYCNBOX
        </span>
        <span className="text-white/10">×</span>
        <span className="text-sm font-semibold text-white/50">Haul Carousel Generator</span>

        <div className="ml-auto flex items-center gap-3">
          <StatusDot state={engineState} />
          <span className="text-xs text-white/30">
            {engineState === 'ready' ? 'Prêt' : engineState === 'starting' ? 'Démarrage…' : 'Inactif'}
          </span>

          {(engineState === 'idle' || engineState === 'error') && (
            <button onClick={handleStart}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all active:scale-95">
              ▶ Démarrer
            </button>
          )}
          {engineState === 'starting' && (
            <button disabled className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs">
              <Spinner size={12} /> Démarrage…
            </button>
          )}
          {engineState === 'ready' && (
            <button onClick={handleStop}
              className="px-4 py-1.5 rounded-lg bg-white/6 hover:bg-red-500/20 text-white/40 hover:text-red-400 text-xs font-bold border border-white/8 transition-all active:scale-95">
              ■ Arrêter
            </button>
          )}
        </div>
      </header>

      {/* ── CONTROL BAR ── */}
      {isReady && (
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">

          {/* Nombre de carrousels */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-white/30">Générer</span>
            <input type="number" value={batchCount} onChange={e => setBatchCount(Math.max(1, Math.min(100, +e.target.value)))}
              min={1} max={100}
              className="w-16 bg-[#0a0a0a] text-white border border-white/8 rounded-lg px-2.5 py-1 text-xs text-center focus:outline-none focus:border-red-500/40 appearance-none caret-white" />
            <span className="text-[10px] uppercase tracking-wide text-white/30">carrousels</span>
          </div>

          {/* Code affilié */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-white/30">Code affilié</span>
            <input type="text" value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)}
              placeholder="MYCNBOX10"
              className="w-32 bg-[#0a0a0a] text-white border border-white/8 rounded-lg px-2.5 py-1 text-xs placeholder-white/20 focus:outline-none focus:border-red-500/40 appearance-none caret-white" />
          </div>

          {/* Backgrounds */}
          <div className="flex items-center gap-1.5 text-[10px] text-white/25">
            <span>🖼</span>
            <span>{bgCount} background{bgCount !== 1 ? 's' : ''} dans</span>
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/40">backgrounds/</code>
          </div>

          <div className="w-px h-4 bg-white/8" />

          {/* Bouton Start / Stop batch */}
          {!batchState.running ? (
            <button onClick={handleStartBatch}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all active:scale-95">
              ⚡ Lancer le batch
            </button>
          ) : (
            <button onClick={handleStopBatch}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 text-sm font-bold transition-all active:scale-95">
              <Spinner size={13} /> Stop ({batchState.done}/{batchState.total})
            </button>
          )}

          {/* Progress */}
          {batchState.running && (
            <div className="flex-1 min-w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${batchState.total ? (batchState.done / batchState.total) * 100 : 0}%` }} />
            </div>
          )}

          {/* DL tout */}
          {doneCount > 0 && !batchState.running && (
            <button onClick={handleDownloadAll}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all active:scale-95">
              ⬇ Tout télécharger ({doneCount})
            </button>
          )}
        </div>
      )}

      {/* ── ERREUR ── */}
      {error && (
        <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400 flex-shrink-0">
          ⚠ {error}
        </div>
      )}
      {batchState.error && (
        <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400 flex-shrink-0">
          ⚠ Batch: {batchState.error}
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto p-6">

        {engineState === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
            <span className="text-5xl opacity-20">🤖</span>
            <p className="text-sm text-center">
              Clique sur <strong className="text-white/35">Démarrer</strong> pour lancer Puppeteer
            </p>
            <div className="text-xs text-white/15 text-center space-y-1">
              <p>Mets tes images dans le dossier <code className="bg-white/5 px-1 rounded">backgrounds/</code></p>
              <p>Les carrousels seront sauvegardés dans <code className="bg-white/5 px-1 rounded">output/</code></p>
            </div>
          </div>
        )}

        {engineState === 'starting' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <Spinner size={28} />
            <p className="text-sm">Ouverture du navigateur + visite de findqc.com…</p>
          </div>
        )}

        {isReady && carousels.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <span className="text-4xl opacity-20">📦</span>
            <p className="text-sm text-center">
              Configure le nombre de carrousels et clique sur <strong className="text-white/35">⚡ Lancer le batch</strong>
            </p>
            {bgCount === 0 && (
              <p className="text-xs text-orange-400/60">
                ⚠ Ajoute des images dans le dossier <code>backgrounds/</code> pour la slide 1
              </p>
            )}
          </div>
        )}

        {carousels.length > 0 && (
          <div>
            {/* Stats */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-white/30">
                {carousels.length} carrousel{carousels.length > 1 ? 's' : ''}
                {doneCount > 0 && <span className="text-emerald-400 ml-2">· {doneCount} prêts</span>}
                {carousels.some(c => c.generating) && <span className="text-orange-400 ml-2">· génération en cours…</span>}
              </p>
              <button onClick={() => setCarousels([])}
                className="text-[10px] text-white/15 hover:text-white/40 transition-colors">
                Effacer la liste
              </button>
            </div>

            {/* Grille */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {carousels.map(c => (
                <CarouselCard key={c.id} carousel={c} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}