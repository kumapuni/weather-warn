const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { URL } = require("node:url");
const {
  buildTickerMessage,
  buildWarningNameMap,
  extractAlerts,
  prioritizeAlerts,
} = require("./lib/alerts");

const PORT = Number(process.env.PORT || 3000);
const REFRESH_SECONDS = Number(process.env.REFRESH_SECONDS || 60);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 10000);
const JMA_WARNING_MAP_URL =
  process.env.JMA_WARNING_MAP_URL || "https://www.jma.go.jp/bosai/warning/data/warning/map.json";
const JMA_WARNING_CONST_URL =
  process.env.JMA_WARNING_CONST_URL || "https://www.jma.go.jp/bosai/warning/data/warning/const.json";
const TARGET_AREAS = (process.env.TARGET_AREAS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const state = {
  alerts: [],
  updatedAt: null,
  sourceError: null,
};

function sendJson(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`source request failed with ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshWarnings() {
  try {
    const [mapData, constData] = await Promise.all([fetchJson(JMA_WARNING_MAP_URL), fetchJson(JMA_WARNING_CONST_URL)]);
    const warningNameMap = buildWarningNameMap(constData);
    const alerts = prioritizeAlerts(extractAlerts(mapData, warningNameMap, TARGET_AREAS));

    state.alerts = alerts;
    state.updatedAt = new Date().toISOString();
    state.sourceError = null;
  } catch (error) {
    state.sourceError = error instanceof Error ? error.message : "unknown source error";
  }
}

function createApiResponse() {
  const tickerText = buildTickerMessage(state.alerts);
  return {
    updatedAt: state.updatedAt,
    refreshSeconds: REFRESH_SECONDS,
    source: {
      mapUrl: JMA_WARNING_MAP_URL,
      constUrl: JMA_WARNING_CONST_URL,
      targetAreas: TARGET_AREAS,
    },
    sourceError: state.sourceError,
    highestAlert: state.alerts[0] || null,
    alerts: state.alerts,
    tickerText,
  };
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/config") {
    return sendJson(res, 200, {
      refreshSeconds: REFRESH_SECONDS,
      fullscreenHint: "ブラウザを全画面表示にして利用してください",
    });
  }

  if (pathname === "/api/alerts") {
    if (!state.updatedAt) {
      await refreshWarnings();
    }
    return sendJson(res, 200, createApiResponse());
  }

  const staticPath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = path.join(PUBLIC_DIR, staticPath);
  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  sendStaticFile(res, resolvedPath);
});

refreshWarnings();
setInterval(refreshWarnings, REFRESH_SECONDS * 1000);

server.listen(PORT, () => {
  console.log(`weather-warn server listening on :${PORT}`);
});
