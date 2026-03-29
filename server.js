import express        from 'express'
import puppeteer      from 'puppeteer'
import fs             from 'fs'
import path           from 'path'
import { fileURLToPath } from 'url'
import { createServer as createVite } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT      = 3000
const BASE      = 'https://findqc.com'
const DB_PATH   = path.join(__dirname, 'db.json')
const BG_DIR    = path.join(__dirname, 'backgrounds')
const OUT_DIR   = path.join(__dirname, 'output')

// ── Dossiers requis
for (const dir of [BG_DIR, OUT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── DB
function readDb() {
  if (!fs.existsSync(DB_PATH)) return { lastPage: 0, articles: {} }
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) }
  catch { return { lastPage: 0, articles: {} } }
}
function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// ── Puppeteer
let browser = null
let page    = null
let state   = 'idle'

async function startBrowser() {
  if (state === 'ready' || state === 'starting') return
  state = 'starting'
  console.log('[puppeteer] Lancement...')
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0')
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7' })
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))
  state = 'ready'
  console.log('[puppeteer] Prêt ✅')
}

async function stopBrowser() {
  state = 'stopping'
  if (browser) { await browser.close(); browser = null; page = null }
  state = 'idle'
}

async function browserFetch(url) {
  if (!page) throw new Error('Puppeteer non démarré')
  const result = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u, {
        credentials: 'include',
        headers: { 'Accept': 'application/json, text/plain, */*' },
      })
      return { ok: r.ok, status: r.status, body: await r.text() }
    } catch (e) { return { ok: false, status: 0, body: e.message } }
  }, url)
  if (!result.ok) throw new Error(`HTTP ${result.status}`)
  return JSON.parse(result.body)
}

// ── Article pool (en mémoire, chargé progressivement)
let articlePool = []
let poolPage    = 0

async function ensurePool(minSize = 8) {
  while (articlePool.length < minSize) {
    poolPage++
    console.log(`[pool] Chargement page ${poolPage}...`)
    const data = await browserFetch(
      `${BASE}/api/goods/list?page=${poolPage}&size=50&langType=en&currencyType=USD`
    )
    if (data.code !== 20000) break
    const items = (data.data?.data || []).filter(i => i.qcPicCnt > 0)
    articlePool.push(...items)
    console.log(`[pool] ${items.length} articles ajoutés, total: ${articlePool.length}`)
    if (!data.data?.hasMore) break
  }
}

function pickRandom(arr, n) {
  const copy = [...arr]
  const picked = []
  while (picked.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length)
    picked.push(copy.splice(idx, 1)[0])
  }
  return picked
}

// ── Fetch QC d'un article
async function fetchArticleQC(item) {
  const url  = `${BASE}/api/goods/detail?itemId=${item.itemId}&mallType=${item.mallType}&currencyType=USD&langType=en&notNeedQc=false`
  const data = await browserFetch(url)
  if (data.code !== 20000) return { urls: [], picUrl: item.pic }
  const d    = data.data?.data
  const urls = (d?.qcList || []).map(q => q.url).filter(Boolean)
  return { urls, picUrl: d?.picUrl || item.pic }
}

// ── Background aléatoire
function getRandomBackground() {
  const exts  = ['.jpg', '.jpeg', '.png', '.webp']
  const files = fs.readdirSync(BG_DIR).filter(f => exts.some(e => f.toLowerCase().endsWith(e)))
  if (!files.length) return null
  return path.join(BG_DIR, files[Math.floor(Math.random() * files.length)])
}

// ── Liste les carrousels générés
function listCarousels() {
  if (!fs.existsSync(OUT_DIR)) return []
  return fs.readdirSync(OUT_DIR)
    .filter(d => fs.statSync(path.join(OUT_DIR, d)).isDirectory())
    .map(id => {
      const dir   = path.join(OUT_DIR, id)
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'))
      const meta  = path.join(dir, 'meta.json')
      let info    = {}
      if (fs.existsSync(meta)) {
        try { info = JSON.parse(fs.readFileSync(meta, 'utf-8')) } catch {}
      }
      return { id, files, createdAt: info.createdAt, articles: info.articles || [] }
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

// ── Express + Vite
async function main() {
  const app  = express()
  const vite = await createVite({ server: { middlewareMode: true }, appType: 'spa' })

  app.use(express.json())

  // Sert les dossiers statiques
  app.use('/output',      express.static(OUT_DIR))
  app.use('/backgrounds', express.static(BG_DIR))

  // ── API routes
  app.get('/status', (_, res) => res.json({ state, poolSize: articlePool.length }))

  async function runBatch(count) {
    console.log(`[batch] Démarrage — ${count} carrousels`)
  
    for (let i = 0; i < count; i++) {
      if (!batchState.running) break
  
      // Assure qu'on a assez d'articles dans le pool (8 par carrousel)
      await ensurePool(8)
      if (articlePool.length < 4) {
        batchState.error = 'Pas assez d\'articles disponibles avec des QC'
        break
      }
  
      // Prend 4 articles aléatoires du pool
      const picked = pickRandom(articlePool, 4)
  
      // Fetch QC pour chaque article
      const articlesWithQC = []
      for (const item of picked) {
        try {
          const { urls, picUrl } = await fetchArticleQC(item)
          articlesWithQC.push({ ...item, picUrl, qcUrls: urls })
          await new Promise(r => setTimeout(r, 100))
        } catch (e) {
          console.warn(`[batch] QC fail pour ${item.id}:`, e.message)
          articlesWithQC.push({ ...item, picUrl: item.pic, qcUrls: [] })
        }
      }
  
      // Génère un ID unique pour ce carrousel
      const carouselId = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`
      const carouselDir = path.join(OUT_DIR, carouselId)
      fs.mkdirSync(carouselDir, { recursive: true })
  
      // Sauvegarde les métadonnées
      const meta = {
        createdAt: new Date().toISOString(),
        articles:  articlesWithQC.map(a => ({ id: a.id, title: a.title, price: a.price })),
      }
      fs.writeFileSync(path.join(carouselDir, 'meta.json'), JSON.stringify(meta, null, 2))
  
      // Envoie les données au front pour génération canvas + stockage
      batchResults.push({
        id: carouselId,
        articles: articlesWithQC,
        backgroundUrl: '/background/random',
      })
  
      batchState.done++
      console.log(`[batch] ${batchState.done}/${batchState.total} — ${carouselId}`)
  
      await new Promise(r => setTimeout(r, 200))
    }
  
    batchState.running = false
    console.log(`[batch] Terminé — ${batchState.done} carrousels`)
  }

  app.post('/start', async (_, res) => {
    try { await startBrowser(); res.json({ ok: true, state }) }
    catch (e) { state = 'error'; res.status(500).json({ ok: false, error: e.message }) }
  })

  app.post('/stop', async (_, res) => {
    await stopBrowser(); res.json({ ok: true, state })
  })

  app.get('/db', (_, res) => res.json(readDb()))

  app.post('/db/reset', (_, res) => {
    writeDb({ lastPage: 0, articles: {} })
    articlePool = []; poolPage = 0
    res.json({ ok: true })
  })

  // Liste des backgrounds dispos
  app.get('/backgrounds', (_, res) => {
    const exts  = ['.jpg', '.jpeg', '.png', '.webp']
    const files = fs.existsSync(BG_DIR)
      ? fs.readdirSync(BG_DIR).filter(f => exts.some(e => f.toLowerCase().endsWith(e)))
      : []
    res.json({ ok: true, files, count: files.length })
  })

  // Liste des carrousels générés
  app.get('/carousels', (_, res) => {
    res.json({ ok: true, carousels: listCarousels() })
  })

  // Supprime un carrousel
  app.delete('/carousels/:id', (req, res) => {
    const dir = path.join(OUT_DIR, req.params.id)
    if (!fs.existsSync(dir)) return res.status(404).json({ ok: false, error: 'not found' })
    fs.rmSync(dir, { recursive: true, force: true })
    res.json({ ok: true })
  })

  // ── Batch : génère N carrousels
  // Chaque carrousel = 4 slides haul avec 4 articles random
  // Sauvegarde les métadonnées + les URLs des slides (pour le front)
  let batchState    = { running: false, done: 0, total: 0, error: '' }
  let batchResults  = []   // { id, slides: [url1..4] } pour preview front

  app.get('/batch/status', (_, res) => res.json({ ...batchState, results: batchResults }))

  app.post('/batch/start', async (req, res) => {
    if (batchState.running) return res.json({ ok: false, error: 'Batch déjà en cours' })

    const count = Math.max(1, Math.min(100, parseInt(req.body.count) || 5))
    batchState  = { running: true, done: 0, total: count, error: '' }
    batchResults = []
    res.json({ ok: true })

    // Lance en arrière-plan
    runBatch(count).catch(e => {
      batchState.error   = e.message
      batchState.running = false
      console.error('[batch] Erreur:', e.message)
    })
  })

  app.post('/batch/stop', (_, res) => {
    batchState.running = false
    res.json({ ok: true })
  })

  // Renvoie une background aléatoire en base64 pour le canvas
  app.get('/background/random', (_, res) => {
    const file = getRandomBackground()
    if (!file) return res.status(404).json({ ok: false, error: 'Aucune image dans backgrounds/' })
    const ext  = path.extname(file).slice(1).replace('jpg', 'jpeg')
    const data = fs.readFileSync(file)
    const b64  = data.toString('base64')
    res.json({ ok: true, dataUrl: `data:image/${ext};base64,${b64}` })
  })

  // Proxy image
  app.get('/image', async (req, res) => {
    try {
      const { url } = req.query
      if (!url) return res.status(400).send('url requis')
      const decoded = decodeURIComponent(url)
      const result  = await page.evaluate(async (u) => {
        try {
          const r = await fetch(u, {
            credentials: 'include',
            headers: { 'Accept': 'image/webp,image/apng,image/*,*/*', 'Referer': 'https://findqc.com/' }
          })
          if (!r.ok) return { ok: false, status: r.status }
          const buf   = await r.arrayBuffer()
          const bytes = Array.from(new Uint8Array(buf))
          return { ok: true, bytes, ct: r.headers.get('content-type') || 'image/jpeg' }
        } catch (e) { return { ok: false, error: e.message } }
      }, decoded)
      if (!result?.ok) return res.status(502).send('image inaccessible')
      res.setHeader('Content-Type', result.ct)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.send(Buffer.from(result.bytes))
    } catch (e) { res.status(500).send(e.message) }
  })

  // ── Fetch articles (pour le mode individuel)
  app.get('/articles', async (req, res) => {
    try {
      const db       = readDb()
      const size     = parseInt(req.query.size) || 50
      const page_num = db.lastPage + 1
      const data     = await browserFetch(
        `${BASE}/api/goods/list?page=${page_num}&size=${size}&langType=en&currencyType=USD`
      )
      if (data.code !== 20000) throw new Error(data.message || 'Erreur API')
      const items = (data.data?.data || [])
        .filter(i => i.qcPicCnt > 0)
        .filter(i => !db.articles[i.id])
        .map(i => ({ id: i.id, itemId: i.itemId, mallType: i.mallType, title: i.title, pic: i.pic, price: i.price, qcPicCnt: i.qcPicCnt }))
      db.lastPage = page_num
      writeDb(db)
      res.json({ ok: true, items, page: page_num, hasMore: data.data?.hasMore })
    } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
  })

  app.get('/qc', async (req, res) => {
    try {
      const { itemId, mallType, goodsId } = req.query
      const data = await browserFetch(
        `${BASE}/api/goods/detail?itemId=${itemId}&mallType=${mallType}&currencyType=USD&langType=en&notNeedQc=false`
      )
      if (data.code !== 20000) return res.json({ ok: true, urls: [], picUrl: null })
      const d    = data.data?.data
      const urls = (d?.qcList || []).map(q => q.url).filter(Boolean)
      const picUrl = d?.picUrl || null
      const db   = readDb()
      if (!db.articles[goodsId]) db.articles[goodsId] = {}
      db.articles[goodsId].qcUrls = urls
      db.articles[goodsId].picUrl = picUrl
      writeDb(db)
      res.json({ ok: true, urls, picUrl })
    } catch (e) { res.status(500).json({ ok: false, error: e.message, urls: [] }) }
  })

  app.post('/done', (req, res) => {
    const { id } = req.body
    const db = readDb()
    if (!db.articles[id]) db.articles[id] = {}
    db.articles[id].done = true
    writeDb(db)
    res.json({ ok: true })
  })

  // Vite
  app.use(vite.middlewares)
  app.listen(PORT, () => console.log(`\n🚀  http://localhost:${PORT}\n`))
}

// ── Fonction batch principale


main().catch(console.error)