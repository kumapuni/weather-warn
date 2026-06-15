const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildWarningNameMap,
  extractAlerts,
  prioritizeAlerts,
  buildTickerMessage,
} = require("../lib/alerts");

test("prioritizes 特別警報 over regular warnings", () => {
  const mapData = [
    {
      name: "東京都",
      warnings: [
        { code: "A01", status: "発表" },
        { code: "B01", status: "発表" },
      ],
    },
  ];

  const constData = {
    warnings: [
      { code: "A01", name: "大雨警報" },
      { code: "B01", name: "高潮特別警報" },
    ],
  };

  const warningNameMap = buildWarningNameMap(constData);
  const alerts = prioritizeAlerts(extractAlerts(mapData, warningNameMap));

  assert.equal(alerts[0].warningName, "高潮特別警報");
  assert.equal(alerts[0].severity, 3);
});

test("removes released warnings and builds ticker text", () => {
  const mapData = [
    {
      name: "大阪府",
      warnings: [
        { code: "A", status: "解除" },
        { code: "B", status: "継続" },
      ],
    },
  ];

  const constData = {
    warnings: [
      { code: "A", name: "洪水警報" },
      { code: "B", name: "危険警報（仮）" },
    ],
  };

  const warningNameMap = buildWarningNameMap(constData);
  const alerts = extractAlerts(mapData, warningNameMap);
  const tickerText = buildTickerMessage(alerts);

  assert.equal(alerts.length, 1);
  assert.equal(tickerText, "大阪府 危険警報（仮）（継続）");
});
