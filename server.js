import express   from 'express'
import puppeteer from 'puppeteer'
import fs        from 'fs'
import path      from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT      = 3000
const BASE      = 'https://findqc.com'
const DB_PATH   = path.join(__dirname, 'db.json')

// ── DB helpers ───────────────────────────────────────────
function readDb() {
  if (!fs.existsSync(DB_PATH)) return { lastPage: 0, articles: {} }
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) }
  catch { return { lastPage: 0, articles: {} } }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// ── Puppeteer ────────────────────────────────────────────
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
    } catch (e) {
      return { ok: false, status: 0, body: e.message }
    }
  }, url)
  if (!result.ok) throw new Error(`HTTP ${result.status}`)
  return JSON.parse(result.body)
}

// ── Express ──────────────────────────────────────────────
const app = express()
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Status
app.get('/status', (req, res) => res.json({ state }))

// Start
app.post('/start', async (req, res) => {
  try { await startBrowser(); res.json({ ok: true, state }) }
  catch (e) { state = 'error'; res.status(500).json({ ok: false, error: e.message }) }
})

// Stop
app.post('/stop', async (req, res) => {
  await stopBrowser(); res.json({ ok: true, state })
})

// DB — retourne l'état persisté
app.get('/db', (req, res) => {
  res.json(readDb())
})

// Reset DB
app.post('/db/reset', (req, res) => {
  writeDb({ lastPage: 0, articles: {} })
  res.json({ ok: true })
})

// Articles — récupère la page suivante, skip ceux déjà en DB
app.get('/articles', async (req, res) => {
  try {
    const db   = readDb()
    const size = parseInt(req.query.size) || 50
    const page_num = db.lastPage + 1

    const data = await browserFetch(
      `${BASE}/api/goods/list?page=${page_num}&size=${size}&langType=en&currencyType=USD`
    )
    if (data.code !== 20000) throw new Error(data.message || 'Erreur API')

    const items = (data.data?.data || [])
      .filter(item => item.qcPicCnt > 0)                  // seulement ceux avec QC
      .filter(item => !db.articles[item.id])               // skip déjà en DB
      .map(item => ({
        id:       item.id,
        itemId:   item.itemId,
        mallType: item.mallType,
        title:    item.title,
        pic:      item.pic,
        price:    item.price,
        qcPicCnt: item.qcPicCnt,
      }))

    // Sauvegarde la page atteinte
    db.lastPage = page_num
    writeDb(db)

    res.json({ ok: true, items, page: page_num, hasMore: data.data?.hasMore })
  } catch (e) { res.status(500).json({ ok: false, error: e.message }) }
})

// QC — récupère les photos QC d'un article via /api/goods/detail
app.get('/qc', async (req, res) => {
  try {
    const { itemId, mallType, goodsId } = req.query

    // notNeedQc=false → l'API inclut qcList dans la réponse
    const url = `${BASE}/api/goods/detail?itemId=${itemId}&mallType=${mallType}&currencyType=USD&langType=en&notNeedQc=false`
    console.log('[QC] params reçus → goodsId:', goodsId, 'itemId:', itemId, 'mallType:', mallType)
    console.log('[QC] fetch:', url)

    const data = await browserFetch(url)
    console.log('[QC] response code:', data.code)
    console.log('[QC] data.data keys:', Object.keys(data.data || {}))
    console.log('[QC] data.data.id:', data.data?.id)
    console.log('[QC] data.data.itemId:', data.data?.itemId)
    console.log('[QC] data.data.qcList length:', data.data?.qcList?.length ?? 'UNDEFINED')
    console.log('[QC] data.data.hasRegularQc:', data.data?.hasRegularQc)
    // Log premiers éléments de qcList si présent
    if (data.data?.qcList?.length > 0) {
      console.log('[QC] first url:', data.data.qcList[0].url)
    }

    if (data.code !== 20000) {
      console.log('[QC] bad code:', data.code)
      return res.json({ ok: true, urls: [] })
    }

    // La structure est data.data.data.qcList (un niveau supplémentaire)
    const item   = data.data?.data
    const qcList = item?.qcList || []
    const urls   = qcList.map(q => q.url).filter(Boolean)
    // picUrl depuis le détail = toujours sur cdn.findqc.com → chargeable directement
    const picUrl = item?.picUrl || null
    console.log('[QC] item.id:', item?.id, '| qcList:', qcList.length, '| picUrl:', picUrl)

    // Persiste
    const db = readDb()
    if (!db.articles[goodsId]) db.articles[goodsId] = {}
    db.articles[goodsId].qcUrls = urls
    db.articles[goodsId].picUrl = picUrl
    writeDb(db)

    res.json({ ok: true, urls, picUrl })
  } catch (e) {
    console.error('[QC] ERROR:', e.message)
    res.status(500).json({ ok: false, error: e.message, urls: [] })
  }
})

// Marque un article comme généré
app.post('/done', (req, res) => {
  const { id } = req.body
  const db = readDb()
  if (!db.articles[id]) db.articles[id] = {}
  db.articles[id].done = true
  writeDb(db)
  res.json({ ok: true })
})


// Proxy image — fetch via Puppeteer (cookies inclus) → renvoie bytes avec CORS header
// Utilisé par le canvas pour charger les images sans taint
app.get('/image', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).send('url requis')

    const decoded = decodeURIComponent(url)

    // Fetch l'image via page Puppeteer — cookies inclus, contourne les restrictions
    const result = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, {
          credentials: 'include',
          headers: {
            'Accept': 'image/webp,image/apng,image/*,*/*',
            'Referer': 'https://findqc.com/',
          }
        })
        if (!r.ok) return { ok: false, status: r.status }
        const buf   = await r.arrayBuffer()
        const bytes = Array.from(new Uint8Array(buf))
        return { ok: true, bytes, ct: r.headers.get('content-type') || 'image/jpeg' }
      } catch (e) { return { ok: false, error: e.message } }
    }, decoded)

    if (!result?.ok) return res.status(502).send('image inaccessible')

    res.setHeader('Content-Type',                result.ct)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control',               'public, max-age=3600')
    res.send(Buffer.from(result.bytes))
  } catch (e) {
    console.error('[image] ERROR:', e.message)
    res.status(500).send(e.message)
  }
})

app.listen(PORT, () => console.log(`\n✅  Express → http://localhost:${PORT}\n`))