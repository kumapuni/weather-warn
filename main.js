const DEFAULT_MESSAGE = '気象警報を取得しています...';
const UPDATE_INTERVAL_MS = 60_000;

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

async function fetchWarnings() {
  try {
    setStatus('警報情報を更新中...');
    const response = await fetch('/warnings.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const message = data?.message?.trim();
    if (message) {
      setTicker(message);
      setStatus(data.status || '警報を表示中');
      setUpdatedAt(new Date());
    } else {
      setTicker(DEFAULT_MESSAGE);
      setStatus('表示する警報はありません');
      setUpdatedAt(new Date());
    }
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
