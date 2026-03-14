const http = require('http')
const httpProxy = require('http-proxy')
const { exec } = require('child_process')

const EFR_PORT = 5618
const PROXY_PORT = 8080
const EFR_PATH = '/efr'

const BUTTON_SCRIPT = `<script>
(function() {

  if (window.__EFR_CLEAR_BTN__) return;
  window.__EFR_CLEAR_BTN__ = true;

  if (document.getElementById('efr-clear-btn')) return;

  var style = document.createElement('style');
  style.textContent = '#efr-clear-btn{position:fixed;top:24px;left:24px;z-index:99999;background:#e53e3e;color:white;border:none;padding:14px 22px;border-radius:50px;font-size:15px;font-family:sans-serif;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);}#efr-toast{position:fixed;top:70px;left:24px;z-index:99999;background:#1a1a1a;color:#4ade80;padding:10px 18px;border-radius:8px;font-size:13px;font-family:sans-serif;display:none;border-radius:8px;}';

  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'efr-clear-btn';
  btn.textContent = '🗑️ Clear Cache';

  var toast = document.createElement('div');
  toast.id = 'efr-toast';

  document.body.appendChild(btn);
  document.body.appendChild(toast);

  btn.onclick = async function() {

    btn.disabled = true;
    btn.textContent = '⏳ Clearing...';

    toast.style.display = 'block';
    toast.style.color = '#facc15';
    toast.textContent = 'Running...';

    try {

      var res = await fetch('/__efr_clear', { method: 'POST' });
      var data = await res.json();

      toast.style.color = data.success ? '#4ade80' : '#f87171';
      toast.textContent = data.success ? '✅ Cleared!' : '❌ ' + data.error;

    } catch(e) {

      toast.style.color = '#f87171';
      toast.textContent = '❌ Failed!';

    }

    btn.disabled = false;
    btn.textContent = '🗑️ Clear Cache';

    setTimeout(function(){
      toast.style.display = 'none';
    },3000);

  };

})();
</script>`


const proxy = httpProxy.createProxyServer({})

const server = http.createServer((req, res) => {

  if (req.method === 'POST' && req.url === '/__efr_clear') {

    const cmd = \`rm -rf \${EFR_PATH}/gbl/* \${EFR_PATH}/log/* \${EFR_PATH}/rn/* \${EFR_PATH}/temp/*\`

    exec(cmd, (error, stdout, stderr) => {

      res.writeHead(200, { 'Content-Type': 'application/json' })

      if (error) {
        res.end(JSON.stringify({ success:false, error: stderr || error.message }))
      } else {
        res.end(JSON.stringify({ success:true }))
      }

    })

    return
  }

  const options = {
    target: \`http://localhost:\${EFR_PORT}\`,
    selfHandleResponse: true
  }

  proxy.web(req, res, options)

})


proxy.on('proxyRes', (proxyRes, req, res) => {

  const contentType = proxyRes.headers['content-type'] || ''
  const encoding = proxyRes.headers['content-encoding'] || ''

  if (contentType.includes('text/html') && !encoding) {

    const chunks = []

    proxyRes.on('data', chunk => chunks.push(chunk))

    proxyRes.on('end', () => {

      let body = Buffer.concat(chunks).toString('utf8')

      if (!body.includes('id="efr-clear-btn"')) {

        if (body.includes('</body>')) {
          body = body.replace('</body>', BUTTON_SCRIPT + '</body>')
        } else {
          body += BUTTON_SCRIPT
        }

      }

      const headers = { ...proxyRes.headers }

      delete headers['content-encoding']

      headers['content-length'] = Buffer.byteLength(body)

      res.writeHead(proxyRes.statusCode, headers)

      res.end(body)

    })

  }
  else {

    res.writeHead(proxyRes.statusCode, proxyRes.headers)

    proxyRes.pipe(res)

  }

})


server.listen(PROXY_PORT, () => {

  console.log('EFR Proxy running on port ' + PROXY_PORT)

})
