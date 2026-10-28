const CDN_FILTERS = ['https://*.bblmw.cn/*', 'https://*.bambulab.cn/*', 'https://*.bblmw.com/*'];
const TIMEOUT = 60000;
let pending = null;
async function report(state, message) {
  await chrome.storage.local.set({job:{state, message, time:Date.now()}});
}
function validCdn(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(?:^|\.)(?:bblmw\.cn|bambulab\.cn|bblmw\.com)$/.test(u.hostname) && /\.3mf$/i.test(u.pathname);
  } catch { return false; }
}
function safeName(title, profile) {
  const base = (title || 'MakerWorld 模型').replace(/\s*[-–|]\s*(免费\s*)?(3D打印模型|3D 打印模型|MakerWorld).*$/i, '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim().slice(0,100) || 'MakerWorld 模型';
  return `${base}${profile ? ' - '+profile : ''}.3mf`;
}
async function getBambuddyToken(origin) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url || !tab.id) continue;
    try { if (new URL(tab.url).origin !== origin) continue; } catch { continue; }
    try {
      const [{result}] = await chrome.scripting.executeScript({target:{tabId:tab.id}, world:'MAIN', func:() => sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token') || null});
      if (result) return result;
    } catch { /* try another open Bambuddy tab */ }
  }
  throw new Error('请在 Chrome 中打开并登录配置的 Bambuddy 地址，然后重试。');
}
async function transfer(url, job) {
  try {
    await report('running', '已取得下载链接，正在下载 3MF…');
    const response = await fetch(url, {credentials:'omit', redirect:'error'});
    if (!response.ok) throw new Error(`MakerWorld 文件下载失败（HTTP ${response.status}）。`);
    const declared = Number(response.headers.get('content-length'));
    if (declared > 300 * 1024 * 1024) throw new Error('3MF 文件超过 300 MB。');
    const blob = await response.blob();
    if (blob.size > 300 * 1024 * 1024) throw new Error('3MF 文件超过 300 MB。');
    const sig = new Uint8Array(await blob.slice(0,4).arrayBuffer());
    if (sig[0] !== 0x50 || sig[1] !== 0x4b || sig[2] !== 0x03 || sig[3] !== 0x04) throw new Error('下载内容不是有效的 3MF 压缩文件，可能需要重新登录或人机验证。');
    const token = await getBambuddyToken(job.origin);
    const form = new FormData();
    const name = safeName(job.title, job.profile);
    form.append('file', blob, name);
    await report('running', `正在上传 ${name}…`);
    const uploaded = await fetch(job.origin + '/api/v1/library/files?generate_stl_thumbnails=true', {method:'POST', headers:{Authorization:`Bearer ${token}`}, body:form, redirect:'error'});
    if (!uploaded.ok) {
      throw new Error(`Bambuddy 上传失败（HTTP ${uploaded.status}）。请检查登录状态和上传权限。`);
    }
    await report('success', `导入完成：${name}\n可在 Bambuddy 文件管理器中查看。`);
  } catch (e) { await report('error', e.message || '导入失败。'); }
}
chrome.webRequest.onBeforeRequest.addListener(details => {
  if (!pending || details.tabId !== pending.tabId || !validCdn(details.url)) return;
  const job = pending; pending = null; clearTimeout(job.timer);
  void transfer(details.url, job);
}, {urls:CDN_FILTERS});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'START') return;
  (async () => {
    if (pending) throw new Error('另一个导入正在进行，请稍候。');
    const {origin, job: old} = await chrome.storage.local.get(['origin','job']);
    if (!origin) throw new Error('请先配置 Bambuddy 地址。');
    if (old?.state === 'running' && Date.now()-old.time < 180000) throw new Error('另一个导入正在进行，请稍候。');
    const tab = await chrome.tabs.get(message.tabId);
    if (!tab.url || !/^https:\/\/makerworld\.com(?:\.cn)?\/(?:[^/]+\/)?models\/\d+/.test(tab.url)) throw new Error('请打开 MakerWorld 模型页面。');
    // Verify the destination is already logged in before starting the download.
    await getBambuddyToken(origin);
    const profile = tab.url.match(/#profileId-(\d+)/)?.[1] || '';
    const job = {origin, tabId:tab.id, title:tab.title, profile};
    pending = job;
    job.timer = setTimeout(() => { if (pending === job) { pending = null; void report('error','未捕获到 3MF 下载。请检查是否登录、是否有下载权限或需要完成网站验证，然后重试。'); } }, TIMEOUT);
    await report('running', '正在请求下载当前选中的打印配置…');
    try {
      const [{result}] = await chrome.scripting.executeScript({target:{tabId:tab.id}, func:async () => {
        const leaf = text => [...document.querySelectorAll('span,button,div')].find(e => e.textContent.trim() === text && e.getClientRects().length && ![...e.children].some(c => c.textContent.trim() === text));
        let item = leaf('下载 3MF') || leaf('Download 3MF');
        if (!item || !item.getClientRects().length) {
          const primary = document.querySelector('.primaryButton');
          const arrow = primary?.parentElement?.querySelector('.icon-box');
          if (!arrow) return '找不到下载菜单，请确认已选择打印配置。';
          arrow.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          item = leaf('下载 3MF') || leaf('Download 3MF');
        }
        if (!item || !item.getClientRects().length) return '下载菜单中没有“下载 3MF”。';
        item.click();
        return null;
      }});
      if (result) throw new Error(result);
    } catch (error) { if (pending === job) pending = null; clearTimeout(job.timer); throw error; }
    return {ok:true};
  })().then(sendResponse).catch(async e => { await report('error',e.message); sendResponse({ok:false,error:e.message}); });
  return true;
});
chrome.runtime.onStartup.addListener(async () => { const {job}=await chrome.storage.local.get('job'); if (job?.state==='running') await report('error','浏览器重启导致导入中断，请重试。'); });
