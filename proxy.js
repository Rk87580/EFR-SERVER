const http = require('http')
const httpProxy = require('http-proxy')
const { exec } = require('child_process')

const PROXY_PORT = process.env.PORT || 8080
const EFR_PORT = 5618
const EFR_PATH = '/efr'

const proxy = httpProxy.createProxyServer({})

proxy.on('error', (err, req, res) => {
  console.error("Proxy error:", err.message)
  res.writeHead(502)
  res.end("EFR not reachable")
})

const BUTTON_SCRIPT = `<script>
(function(){
if(window.__EFRBTN__) return;
window.__EFRBTN__=true;

var style=document.createElement('style');
style.textContent='#efr-clear-btn{position:fixed;top:20px;left:20px;z-index:99999;background:#e53e3e;color:#fff;border:none;padding:14px 20px;border-radius:40px;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,.3);}';
document.head.appendChild(style);

var btn=document.createElement('button');
btn.id='efr-clear-btn';
btn.innerText='🗑 Clear Cache';
document.body.appendChild(btn);

btn.onclick=async()=>{
btn.innerText='Clearing...';
try{
await fetch('/__efr_clear',{method:'POST'});
btn.innerText='✅ Cleared';
}catch{
btn.innerText='❌ Failed';
}
setTimeout(()=>btn.innerText='🗑 Clear Cache',2000);
};
})();
</script>`

const server = http.createServer((req,res)=>{

// CLEAR CACHE API
if(req.method==='POST' && req.url==='/__efr_clear'){

const cmd=`rm -rf ${EFR_PATH}/gbl/* ${EFR_PATH}/log/* ${EFR_PATH}/rn/* ${EFR_PATH}/temp/*`

exec(cmd,(err)=>{
res.writeHead(200,{'Content-Type':'application/json'})
res.end(JSON.stringify({success:!err}))
})

return
}

// PROXY REQUEST
proxy.web(req,res,{
target:`http://127.0.0.1:${EFR_PORT}`,
selfHandleResponse:true
})

})

// HTML INJECTION
proxy.on('proxyRes',(proxyRes,req,res)=>{

const type=proxyRes.headers['content-type']||''

if(type.includes('text/html')){

let chunks=[]

proxyRes.on('data',c=>chunks.push(c))

proxyRes.on('end',()=>{

let body=Buffer.concat(chunks).toString()

if(!body.includes('efr-clear-btn')){
body=body.replace('</body>',BUTTON_SCRIPT+'</body>')
}

delete proxyRes.headers['content-length']

res.writeHead(proxyRes.statusCode,proxyRes.headers)
res.end(body)

})

}else{
res.writeHead(proxyRes.statusCode,proxyRes.headers)
proxyRes.pipe(res)
}

})

server.listen(PROXY_PORT,()=>{
console.log("Proxy running on port",PROXY_PORT)
})
