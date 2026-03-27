import { useState, useEffect, useRef } from 'react'
import { StatusBar }       from './components/StatusBar.jsx'
import { Spinner }         from './components/Spinner.jsx'
import { ArticleCard }     from './components/ArticleCard.jsx'
import { generateCarousel, downloadCarousel } from './slides/generateCarousel.js'
import { HaulCarousel } from './components/HaulCarousel.jsx'

export default function App() {
  const [engineState,   setEngineState]   = useState('idle')
  const [articles,      setArticles]      = useState([])
  const [generating,    setGenerating]    = useState({})   // id → 'loading'|'done'
  const [loadingArt,    setLoadingArt]    = useState(false)
  const [batchRunning,  setBatchRunning]  = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })
  const [error,         setError]         = useState('')
  const [dbInfo,        setDbInfo]        = useState({ lastPage: 0, articles: {} })
  const [agentPrice,    setAgentPrice]    = useState('')   // Prix agent saisi manuellement
  const [affiliateCode, setAffiliateCode] = useState('')   // Code affilié
  const stopBatch = useRef(false)

  // Poll status
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

  // Charge la DB au démarrage
  useEffect(() => {
    fetch('/db').then(r => r.json()).then(d => setDbInfo(d)).catch(() => {})
  }, [])

  // ── Start / Stop
  const handleStart = async () => {
    setError('')
    setEngineState('starting')
    const r = await fetch('/start', { method: 'POST' })
    const d = await r.json()
    if (!d.ok) { setError(d.error); setEngineState('error') }
  }

  const handleStop = async () => {
    stopBatch.current = true
    setBatchRunning(false)
    await fetch('/stop', { method: 'POST' })
  }

  // ── Charger les articles (page suivante)
  const handleLoadMore = async () => {
    setLoadingArt(true); setError('')
    try {
      const r = await fetch('/articles?size=50')
      const d = await r.json()
      if (!d.ok) throw new Error(d.error)
      setArticles(prev => [...prev, ...d.items.map(i => ({ ...i, _slides: null }))])
      setDbInfo(prev => ({ ...prev, lastPage: d.page }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingArt(false)
    }
  }

  // ── Génère le carrousel d'un article
  const generateOne = async (item) => {
    setGenerating(g => ({ ...g, [item.id]: 'loading' }))
    setError('')
    try {
      // Récupère les QC + picUrl (cdn.findqc.com) depuis le détail
      const r      = await fetch(`/qc?itemId=${item.itemId}&mallType=${item.mallType}&goodsId=${item.id}`)
      const d      = await r.json()
      const qcUrls = d.urls || []

      // picUrl du détail est toujours sur cdn.findqc.com → charge directement
      const itemWithPic = { ...item, pic: d.picUrl || item.pic, _qcUrls: qcUrls }

      // Stocke les QC URLs sur l'article dans la liste
      setArticles(prev => prev.map(a => a.id === item.id ? { ...a, _qcUrls: qcUrls, pic: d.picUrl || a.pic } : a))

      // Génère les 4 slides canvas
      const slides = await generateCarousel(itemWithPic, qcUrls, { agentPrice, affiliateCode })

      // Met à jour l'article avec ses slides
      setArticles(prev => prev.map(a => a.id === item.id ? { ...a, _slides: slides } : a))
      setGenerating(g => ({ ...g, [item.id]: 'done' }))

      // Persiste dans la DB
      await fetch('/done', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
    } catch (e) {
      setGenerating(g => ({ ...g, [item.id]: null }))
      setError(`Erreur #${item.id}: ${e.message}`)
    }
  }

  // ── Batch : génère tout
  const handleBatch = async () => {
    if (batchRunning) { stopBatch.current = true; setBatchRunning(false); return }

    stopBatch.current = false
    setBatchRunning(true)
    const todo = articles.filter(a => generating[a.id] !== 'done')
    setBatchProgress({ done: 0, total: todo.length })

    for (const item of todo) {
      if (stopBatch.current) break
      await generateOne(item)
      setBatchProgress(p => ({ ...p, done: p.done + 1 }))
    }
    setBatchRunning(false)
  }

  // ── Télécharge tout
  const handleDownloadAll = () => {
    articles.forEach(item => {
      if (item._slides) downloadCarousel(item._slides, item.id)
    })
  }

  // ── Reset DB
  const handleReset = async () => {
    await fetch('/db/reset', { method: 'POST' })
    setArticles([])
    setGenerating({})
    setDbInfo({ lastPage: 0, articles: {} })
  }

  const isReady   = engineState === 'ready'
  const doneCount = articles.filter(a => generating[a.id] === 'done').length

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── HEADER ── */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-white/5 flex-shrink-0">
        <span className="text-red-500 font-black tracking-[3px] text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          QCFinds
        </span>
        <span className="text-white/10">×</span>
        <span className="text-sm font-semibold text-white/50">Carousel Generator</span>

        <div className="ml-auto flex items-center gap-3">
          {dbInfo.lastPage > 0 && (
            <span className="text-[10px] text-white/20">page {dbInfo.lastPage} · {Object.keys(dbInfo.articles).length} en DB</span>
          )}
          <StatusBar state={engineState} />

          {(engineState === 'idle' || engineState === 'error') && (
            <button onClick={handleStart}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all active:scale-95">
              ▶ Démarrer
            </button>
          )}
          {engineState === 'starting' && (
            <button disabled className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs font-bold">
              <Spinner size={12} /> Démarrage…
            </button>
          )}
          {engineState === 'ready' && (
            <button onClick={handleStop}
              className="px-4 py-1.5 rounded-lg bg-white/6 hover:bg-red-500/20 text-white/50 hover:text-red-400 text-xs font-bold border border-white/8 hover:border-red-500/30 transition-all active:scale-95">
              ■ Arrêter
            </button>
          )}
        </div>
      </header>

      {/* ── TOOLBAR ── */}
      {isReady && (
        <div className="flex items-center gap-2.5 px-6 py-2.5 border-b border-white/5 flex-shrink-0 flex-wrap">
          <button onClick={handleLoadMore} disabled={loadingArt}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-white/70 text-xs font-bold border border-white/8 disabled:opacity-40 transition-all active:scale-95">
            {loadingArt ? <><Spinner size={12} /> Chargement…</> : `↓ Page suivante`}
          </button>

          <div className="w-px h-4 bg-white/8" />

          {/* Prix agent */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/30 uppercase tracking-wide">Prix agent</span>
            <input
              type="text"
              value={agentPrice}
              onChange={e => setAgentPrice(e.target.value)}
              placeholder="ex: 12.50€"
              className="bg-white/4 border border-white/8 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/40 w-24"
            />
          </div>

          {/* Code affilié */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/30 uppercase tracking-wide">Code</span>
            <input
              type="text"
              value={affiliateCode}
              onChange={e => setAffiliateCode(e.target.value)}
              placeholder="MYCNBOX10"
              className="bg-white/4 border border-white/8 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/40 w-28"
            />
          </div>

          {articles.length > 0 && (
            <>
              <div className="w-px h-4 bg-white/8" />
              <button onClick={handleBatch}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  batchRunning
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}>
                {batchRunning
                  ? <><Spinner size={12} /> Stop ({batchProgress.done}/{batchProgress.total})</>
                  : `⚡ Générer tout (${articles.length})`
                }
              </button>

              {doneCount > 0 && (
                <button onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all active:scale-95">
                  ⬇ Tout télécharger ({doneCount})
                </button>
              )}

              {/* Progress bar batch */}
              {batchRunning && (
                <div className="flex-1 min-w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress.total ? (batchProgress.done / batchProgress.total) * 100 : 0}%` }} />
                </div>
              )}

              <button onClick={handleReset}
                className="ml-auto text-[10px] text-white/15 hover:text-white/40 transition-colors px-2 py-1">
                reset DB
              </button>
            </>
          )}
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-400 flex-shrink-0">
          ⚠ {error}
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto p-6">

        {engineState === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <span className="text-5xl opacity-20">🤖</span>
            <p className="text-sm text-center">
              Clique sur <strong className="text-white/35">Démarrer</strong> pour lancer Puppeteer
            </p>
            {dbInfo.lastPage > 0 && (
              <p className="text-xs text-white/15">
                Session précédente : page {dbInfo.lastPage}, {Object.keys(dbInfo.articles).length} articles en DB
              </p>
            )}
          </div>
        )}

        {engineState === 'starting' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <Spinner size={28} />
            <p className="text-sm">Ouverture du navigateur + visite de findqc.com…</p>
          </div>
        )}

        {isReady && articles.length === 0 && !loadingArt && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <span className="text-4xl opacity-20">📦</span>
            <p className="text-sm">Clique sur <strong className="text-white/35">Page suivante</strong> pour charger les articles</p>
          </div>
        )}

        {isReady && articles.length > 0 && (
          <div className="flex flex-col gap-6">

            {/* ── Carrousel Haul global */}
            <HaulCarousel articles={articles} affiliateCode={affiliateCode} />

            {/* ── Séparateur */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] uppercase tracking-[2px] text-white/20">Carrousels individuels</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <p className="text-xs text-white/25">
              {articles.length} articles chargés
              {doneCount > 0 && <span className="text-emerald-400 ml-2">· {doneCount} générés</span>}
            </p>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {articles.map(item => (
                <ArticleCard
                  key={item.id}
                  item={item}
                  onGenerate={generateOne}
                  generating={generating[item.id]}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}