# weather-warn

災害情報をテロップ表示する静的フロントエンドです。GitHub Pages でも表示できる構成を目指しています。

## 使い方

1. 依存関係をインストールします。

```bash
npm install
```

2. 開発サーバーを起動します。

```bash
npm run dev
```

3. ブラウザで表示します。

## GitHub Pages について

この初期版は静的な表示画面として構成しています。`public/warnings.json` を差し替えることで、表示内容を更新できます。

将来的に公開APIから自動取得する場合は、CORS 対応や取得元の仕様に合わせて `main.js` を拡張してください。
