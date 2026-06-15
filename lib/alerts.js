const HIGH_PRIORITY_KEYWORDS = ["特別警報", "危険"];

const RELEASED_STATUSES = ["解除", "なし"];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function severityFromWarningName(name) {
  const warningName = normalizeString(name);
  if (!warningName) return 1;
  if (HIGH_PRIORITY_KEYWORDS.some((word) => warningName.includes(word))) return 3;
  if (warningName.includes("警報")) return 2;
  if (warningName.includes("注意報")) return 1;
  return 1;
}

function shouldIncludeStatus(status) {
  const normalized = normalizeString(status);
  if (!normalized) return true;
  if (RELEASED_STATUSES.some((word) => normalized.includes(word))) return false;
  if (normalized.includes("発表警報・注意報はなし")) return false;
  return true;
}

function buildWarningNameMap(constData) {
  const map = new Map();

  function visit(node, depth = 0) {
    if (!node || depth > 8) return;

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, depth + 1));
      return;
    }

    if (typeof node !== "object") return;

    const code = normalizeString(node.code);
    const name = normalizeString(node.name);
    if (code && name && (name.includes("警報") || name.includes("注意報") || name.includes("危険"))) {
      map.set(code, name);
    }

    Object.values(node).forEach((value) => visit(value, depth + 1));
  }

  visit(constData);
  return map;
}

function isTargetArea(areaName, targetAreas) {
  if (!targetAreas || targetAreas.length === 0) return true;
  return targetAreas.some((target) => areaName.includes(target));
}

function extractAlerts(mapData, warningNameMap, targetAreas = []) {
  if (!Array.isArray(mapData)) return [];

  const alerts = [];
  for (const area of mapData) {
    const areaName = normalizeString(area?.name) || "不明地域";
    if (!isTargetArea(areaName, targetAreas)) continue;

    const warnings = Array.isArray(area?.warnings) ? area.warnings : [];
    for (const warning of warnings) {
      const status = normalizeString(warning?.status) || "発表";
      if (!shouldIncludeStatus(status)) continue;

      const warningCode = normalizeString(warning?.code);
      const warningName = warningNameMap.get(warningCode) || warningCode || "不明警報";

      const severity = severityFromWarningName(warningName);
      alerts.push({
        areaName,
        warningCode,
        warningName,
        status,
        severity,
      });
    }
  }

  return alerts;
}

function prioritizeAlerts(alerts) {
  return [...alerts].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    if (a.areaName !== b.areaName) return a.areaName.localeCompare(b.areaName, "ja");
    return a.warningName.localeCompare(b.warningName, "ja");
  });
}

function buildTickerMessage(alerts) {
  if (!alerts.length) return "現在、表示対象の警報はありません。";
  return alerts.map((alert) => `${alert.areaName} ${alert.warningName}（${alert.status}）`).join("　｜　");
}

module.exports = {
  buildTickerMessage,
  buildWarningNameMap,
  extractAlerts,
  prioritizeAlerts,
  severityFromWarningName,
  shouldIncludeStatus,
};
