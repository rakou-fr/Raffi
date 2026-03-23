// proxy.js — lance avec: node proxy.js
import http  from 'http'
import https from 'https'

const PORT = 3131

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url     = new URL(req.url, `http://localhost:${PORT}`)
  const allowed = ['/api/goods/label', '/api/goods/atlas/regularQc']
  if (!allowed.some(p => url.pathname.startsWith(p))) {
    res.writeHead(403); res.end('{}'); return
  }

  const sessionId = req.headers['x-session-id'] || ''
  const upstream  = https.request({
    hostname: 'findqc.com', port: 443,
    path:     url.pathname + url.search,
    method:   'GET',
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0',
      'Accept':          'application/json, text/plain, */*',
      'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8',
      'Referer':         'https://findqc.com/',
      'Origin':          'https://findqc.com',
      'Cookie':          sessionId ? `FINDSSESSIONID=${sessionId}` : '',
    }
  }, (r) => {
    res.writeHead(r.statusCode, { 'Content-Type': 'application/json' })
    r.pipe(res)
  })
  upstream.on('error', e => { res.writeHead(502); res.end(JSON.stringify({ error: e.message })) })
  upstream.end()
}).listen(PORT, () => {
  console.log(`✅  Proxy QCFinds démarré → http://localhost:${PORT}`)
  console.log(`    Ouvre maintenant l'app React dans un autre terminal: npm run dev`)
})