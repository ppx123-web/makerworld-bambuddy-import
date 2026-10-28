const $ = id => document.getElementById(id);
const address = $('address'), status = $('status');
function show(message, error = false) { status.textContent = message; status.classList.toggle('error', error); }
function normalized(value) {
  const u = new URL(value.trim());
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) throw new Error('请输入完整地址，例如 http://服务器:3215，不要包含路径或账号密码。');
  return u.origin;
}
async function refresh() {
  const {origin, job} = await chrome.storage.local.get(['origin', 'job']);
  if (origin && document.activeElement !== address) address.value = origin;
  if (job) show(job.message, job.state === 'error');
  $('import').disabled = job?.state === 'running';
}
$('save').addEventListener('click', async () => {
  try {
    const origin = normalized(address.value);
    const u = new URL(origin);
    // Chrome host permission patterns cannot contain a port.
    const pattern = `${u.protocol}//${u.hostname}/*`;
    const permission = chrome.permissions.request({origins:[pattern]});
    await chrome.storage.local.set({origin});
    const granted = await permission;
    if (!granted) { await chrome.storage.local.remove('origin'); throw new Error('未获得访问 Bambuddy 地址的权限。'); }
    show('地址已保存。请确保 Bambuddy 已在浏览器中登录。');
  } catch (e) { show(e.message, true); }
});
$('import').addEventListener('click', async () => {
  try {
    const {origin} = await chrome.storage.local.get('origin');
    if (!origin) throw new Error('请先保存 Bambuddy 地址。');
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.url || !/^https:\/\/makerworld\.com(?:\.cn)?\/(?:[^/]+\/)?models\/\d+/.test(tab.url)) throw new Error('请先打开 MakerWorld 模型详情页。');
    $('import').disabled = true;
    const result = await chrome.runtime.sendMessage({type:'START', tabId:tab.id, url:tab.url, title:tab.title});
    if (!result.ok) throw new Error(result.error);
    await refresh();
  } catch(e) { $('import').disabled = false; show(e.message, true); }
});
$('open').addEventListener('click', async () => { const {origin}=await chrome.storage.local.get('origin'); if (origin) await chrome.tabs.create({url:origin+'/files'}); else show('请先保存 Bambuddy 地址。',true); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.job) refresh(); });
refresh();
