# weather-warn

災害情報をテロップ表示する静的フロントエンドです。GitHub Pages でも表示できる構成を目指しています。

## 使い方

```bash
npm install
npm run dev
```

## 警報データ取得

この初期構成では、次の順で警報取得を試みます。

1. `/api/alerts` が利用できる場合は、そこから取得する
2. 利用できない場合は、ブラウザから JMA の公開データを直接取得する

GitHub Pages などの静的ホスティングでは、`/api/alerts` は使えないため、JMA 側の CORS 設定に依存します。もし直接取得できない場合は、Cloudflare Workers や GitHub Actions などの軽量な中継を追加してください。

## GitHub Pages について

Vite の `base: './'` 設定により、静的ビルドを GitHub Pages に配置しやすくしています。

```bash
npm run build
```

生成された `dist/` を Pages に公開してください。
