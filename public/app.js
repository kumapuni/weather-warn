const tickerTrack = document.getElementById("ticker-track");
const headlineText = document.getElementById("headline-text");
const updatedAt = document.getElementById("updated-at");
const fullscreenButton = document.getElementById("fullscreen-btn");

let refreshSeconds = 60;
let refreshTimer;

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP");
}

function updateTickerAnimation(message) {
  const text = `${message}　　${message}`;
  tickerTrack.textContent = text;
  const duration = Math.max(18, Math.ceil(text.length / 5));
  tickerTrack.style.setProperty("--ticker-duration", `${duration}s`);
}

function render(payload) {
  if (payload.sourceError) {
    headlineText.textContent = `データ取得エラー: ${payload.sourceError}`;
  } else if (payload.highestAlert) {
    headlineText.textContent = `${payload.highestAlert.areaName} ${payload.highestAlert.warningName}`;
  } else {
    headlineText.textContent = "現在、重大な警報は確認されていません。";
  }

  updatedAt.textContent = `更新時刻: ${formatTime(payload.updatedAt)}`;
  updateTickerAnimation(payload.tickerText || "表示データはありません。");
}

async function fetchConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (Number.isFinite(payload.refreshSeconds) && payload.refreshSeconds >= 10) {
      refreshSeconds = payload.refreshSeconds;
    }
  } catch {
    // noop
  }
}

async function fetchAlerts() {
  try {
    const response = await fetch("/api/alerts", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    render(payload);
  } catch (error) {
    headlineText.textContent = `データ更新失敗: ${error.message}`;
  }
}

async function initialize() {
  await fetchConfig();
  await fetchAlerts();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(fetchAlerts, refreshSeconds * 1000);
}

fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await document.documentElement.requestFullscreen();
});

initialize();
