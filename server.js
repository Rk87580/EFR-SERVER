const express = require('express')
const { exec } = require('child_process')
const path = require('path')
const app = express()

const PORT = process.env.ADMIN_PORT || 3000
const EFR_PATH = '/efr'

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>EFR Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: sans-serif; 
      background: #0f0f0f; 
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 40px;
      width: 420px;
      text-align: center;
    }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { color: #888; font-size: 14px; margin-bottom: 32px; }
    button {
      background: #e53e3e;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    button:hover { background: #c53030; }
    button:disabled { background: #555; cursor: not-allowed; }
    #output {
      margin-top: 24px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      font-size: 13px;
      text-align: left;
      min-height: 60px;
      color: #4ade80;
      display: none;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>EFR Admin Panel</h1>
    <p>Clears gbl, log, rn and temp folders</p>
    <button id="btn" onclick="clearFolders()">🗑️ Clear EFR Cache</button>
    <div id="output"></div>
  </div>
  <script>
    async function clearFolders() {
      const btn = document.getElementById('btn')
      const output = document.getElementById('output')
      btn.disabled = true
      btn.textContent = 'Clearing...'
      output.style.display = 'block'
      output.textContent = 'Running...'
      try {
        const res = await fetch('/clear', { method: 'POST' })
        const data = await res.json()
        if (data.success) {
          output.style.color = '#4ade80'
          output.textContent = '✅ Done!\n' + (data.output || 'Cleared successfully')
        } else {
          output.style.color = '#f87171'
          output.textContent = '❌ Error:\n' + data.error
        }
      } catch(e) {
        output.style.color = '#f87171'
        output.textContent = '❌ Failed to connect'
      }
      btn.disabled = false
      btn.textContent = '🗑️ Clear EFR Cache'
    }
  </script>
</body>
</html>
  `)
})

app.post('/clear', (req, res) => {
  const cmd = `rm -rf ${EFR_PATH}/gbl/* ${EFR_PATH}/log/* ${EFR_PATH}/rn/* ${EFR_PATH}/temp/*`
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      return res.json({ success: false, error: stderr || error.message })
    }
    res.json({ success: true, output: stdout || 'All folders cleared!' })
  })
})

app.listen(PORT, () => {
  console.log(`Admin panel running on port ${PORT}`)
})
