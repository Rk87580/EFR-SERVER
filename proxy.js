const http = require('http')
const httpProxy = require('http-proxy')
const { exec } = require('child_process')

const proxy = httpProxy.createProxyServer({})
const EFR_PORT = 5618
const PROXY_PORT = 8080
const EFR_PATH = '/efr'

const FLOATING_BUTTON = `
<style>
  #efr-clear-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    background: #e53e3e;
    color: white;
    border: none;
    padding: 14px 22px;
    border-radius: 50px;
    font-size: 15px;
    font-family: sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: all 0.2s;
  }
  #efr-clear-btn:hover { background: #c53030; transform: scale(1.05); }
  #efr-clear-btn:disabled { background: #888; cursor: not-allowed; transform: none; }
  #efr-toast {
    position: fixed;
    bottom: 80px;
    right: 24px;
    z-index: 99999;
    background: #1a1a1a;
    color: #4ade80;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-family: sans-serif;
    display: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
</style>
<button id="efr-clear-btn" onclick="efrClear()">🗑️ Clear Cache</button>
<div id="efr-toast"></div>
<script>
async function efrClear() {
  const btn = document.getElementById('efr-clear-btn')
  const toast = document.getElementById('efr-toast')
  btn.disabled = true
  btn.textContent = '⏳ Clearing...'
  toast.style.display = 'block'
  toast.style.color = '#facc15'
  toast.textContent = 'Running clear command...'
  try {
    const res = await fetch('/__efr_clear', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      toast.style.color = '#4ade80'
      toast.textContent = '✅ Cache cleared!'
    } else {
      toast.style.color = '#f87171'
      toast.textContent = '❌ Error: ' + data.error
    }
  } catch(e) {
    toast.style.color = '#f87171'
    toast.textContent = '❌ Failed!'
  }
  btn.disabled = false
  btn.textContent = '🗑️ Clear Cache'
  setTimeout(() => toast.style.display = 'none', 3000)
}
</script>
`

const server = http.createServer((req, res) => {
  // Handle clear API
  if (req.method === 'POST' && req.url === '/__efr_clear') {
    const cmd = `rm -rf ${EFR_PATH}/gbl/* ${EFR_PATH}/log/* ${EFR_PATH}/rn/* ${EFR_PATH}/temp/*`
    exec(cmd, (error, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (error) {
        res.end(JSON.stringify({ success: false, error: stderr || error.message }))
      } else {
        res.end(JSON.stringify({ success: true }))
      }
    })
    return
  }

  // Proxy everything else to EFR
  const chunks = []
  const _writeHead = res.writeHead.bind(res)
  const _write = res.write.bind(res)
  const _end = res.end.bind(res)

  proxy.web(req, res, { 
    target: `http://localhost:${EFR_PORT}`,
    selfHandleResponse: true
  }, (err) => {
    res.writeHead(502)
    res.end('EFR not available')
  })

  proxy.on('proxyRes', (proxyRes, req, res) => {
    const contentType = proxyRes.headers['content-type'] || ''
    
    if (contentType.includes('text/html')) {
      let body = ''
      proxyRes.on('data', chunk => body += chunk)
      proxyRes.on('end', () => {
        body = body.replace('</body>', FLOATING_BUTTON + '</body>')
        const headers = { ...proxyRes.headers }
        delete headers['content-encoding']
        headers['content-length'] = Buffer.byteLength(body)
        res.writeHead(proxyRes.statusCode, headers)
        res.end(body)
      })
    } else {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  })
})

server.listen(PROXY_PORT, () => {
  console.log(`Proxy running on port ${PROXY_PORT}`)
})
