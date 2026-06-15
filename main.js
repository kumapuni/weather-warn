const DEFAULT_MESSAGE = '気象警報を取得しています...';
const UPDATE_INTERVAL_MS = 60_000;

const API_URLS = [
  '/api/alerts',
  'https://www.jma.go.jp/bosai/warning/data/warning/map.json',
].map((url) => url.trim());

const tickerText = document.getElementById('ticker-text');
const statusEl = document.getElementById('status');
const updatedAtEl = document.getElementById('updated-at');
const refreshBtn = document.getElementById('refresh-btn');

function setTicker(message) {
  tickerText.textContent = message;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setUpdatedAt(date = new Date()) {
  updatedAtEl.textContent = `最終更新: ${date.toLocaleString('ja-JP')}`;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function buildTickerMessageFromJma(mapData) {
  if (!Array.isArray(mapData)) return '';
  const parts = [];
  for (const area of mapData) {
    const areaName = area?.name;
    const warnings = Array.isArray(area?.warnings) ? area.warnings : [];
    for (const warning of warnings) {
      const status = warning?.status || '';
      if (status.includes('解除') || status.includes('なし')) continue;
      const code = warning?.code || '';
      if (!code) continue;
      parts.push(`${areaName} ${code}`);
    }
  }
  return parts.join(' / ');
}

async function fetchWarnings() {
  try {
    setStatus('警報情報を更新中...');

    // Preferred: local API/proxy route when available.
    try {
      const payload = await fetchJson('/api/alerts');
      const message = payload?.tickerText?.trim();
      if (message) {
        setTicker(message);
        setStatus(payload.sourceError ? `取得時エラー: ${payload.sourceError}` : (payload.highestAlert ? '警報を表示中' : '表示する警報はありません'));
        setUpdatedAt(new Date(payload.updatedAt || Date.now()));
        return;
      }
    } catch (error) {
      console.warn('Local API unavailable, trying direct JMA fetch.', error);
    }

    // Static-friendly fallback: browser fetch from JMA if CORS permits.
    const mapData = await fetchJson(API_URLS[1]);
    const message = buildTickerMessageFromJma(mapData);
    if (message) {
      setTicker(message);
      setStatus('JMAから直接取得中');
    } else {
      setTicker(DEFAULT_MESSAGE);
      setStatus('表示する警報はありません');
    }
    setUpdatedAt(new Date());
  } catch (error) {
    console.error(error);
    setTicker('警報データの取得に失敗しました');
    setStatus('オフラインまたは取得失敗');
    setUpdatedAt(new Date());
  }
}

refreshBtn.addEventListener('click', fetchWarnings);
setTicker(DEFAULT_MESSAGE);
setUpdatedAt(new Date());
fetchWarnings();
setInterval(fetchWarnings, UPDATE_INTERVAL_MS);
