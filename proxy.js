const http = require('http')
const httpProxy = require('http-proxy')
const { exec } = require('child_process')

const PROXY_PORT = process.env.PORT || 8080
const EFR_PORT = 5618
const EFR_PATH = '/efr'

const proxy = httpProxy.createProxyServer({})

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message)
  res.writeHead(502)
  res.end('EFR not reachable')
})

const BUTTON_SCRIPT = `<script>
(function(){
if(window.__EFR_CLEAR_BTN__) return;
window.__EFR_CLEAR_BTN__=true;

var style=document.createElement('style');
style.textContent='#efr-clear-btn{position:fixed;top:24px;left:24px;z-index:99999;background:#e53e3e;color:#fff;border:none;padding:14px 22px;border-radius:50px;font-size:15px;cursor:pointer;}';
document.head.appendChild(style);

var btn=document.createElement('button');
btn.id='efr-clear-btn';
btn.textContent='🗑️ Clear Cache';
document.body.appendChild(btn);

btn.onclick=async function(){
btn.textContent='Clearing...';
try{
await fetch("/__efr_clear",{method:"POST"});
btn.textContent='✅ Cleared';
}catch(e){
btn.textContent='❌ Failed';
}
setTimeout(()=>btn.textContent='🗑️ Clear Cache',2000);
};
})();
</script>`

const server = http.createServer((req,res)=>{

if(req.method==='POST' && req.url==='/__efr_clear'){

const cmd=`rm -rf ${EFR_PATH}/gbl/* ${EFR_PATH}/log/* ${EFR_PATH}/rn/* ${EFR_PATH}/temp/*`

exec(cmd,(error,stdout,stderr)=>{

res.writeHead(200,{'Content-Type':'application/json'})

if(error){
res.end(JSON.stringify({success:false}))
}else{
res.end(JSON.stringify({success:true}))
}

})

return
}

proxy.web(req,res,{
target:`http://127.0.0.1:${EFR_PORT}`,
selfHandleResponse:true
})

})

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
console.log("Proxy running on "+PROXY_PORT)
})
