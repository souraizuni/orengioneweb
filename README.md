# 橙興生活文創 - 商品查詢系統

這是一個基於 Google Sheets 的商品查詢系統，可以透過 GitHub Pages 發布，無需後端伺服器。

## 功能特色

- 📋 連接 Google Sheets 讀取商品資料
- 🔍 即時搜尋商品（支援商品編號、名稱、售價、條碼）
- 📱 響應式設計，支援手機、平板、桌面裝置
- 💾 自動記住 Google Sheet 設定（使用 localStorage）
- 🎨 現代化 UI 設計

## 使用方式

### 1. 準備 Google Sheet

建立一個 Google 試算表，第一列為標題列，包含以下欄位：

| 商品編號 | 商品名稱 | 售價 | 條碼 |
|---------|---------|------|------|
| P001    | 商品A   | 100  | 1234567890 |
| P002    | 商品B   | 200  | 0987654321 |

**重要：** 標題列必須包含「編號」、「名稱」、「價」、「條碼」等關鍵字

### 2. 設定 Google Sheet 分享權限

1. 開啟您的 Google Sheet
2. 點選右上角「共用」按鈕
3. 點選「取得連結」
4. 將權限設定為「知道連結的人皆可查看」
5. 複製分享連結

### 3. 使用商品查詢系統

1. 開啟網站：`https://你的用戶名.github.io/orengioneweb/products.html`
2. 貼上 Google Sheet 的分享連結
3. 點選「載入商品資料」
4. 開始搜尋商品！

## 部署到 GitHub Pages

### 方法一：透過 Settings 設定

1. 進入 GitHub repository
2. 點選 Settings → Pages
3. Source 選擇分支（通常是 `main` 或 `master`）
4. 儲存後等待幾分鐘即可訪問

### 方法二：使用 GitHub Actions（自動部署）

代碼推送到 main 分支後會自動部署到 GitHub Pages。

## 檔案結構

```
orengioneweb/
├── index.html          # 首頁（包含導航）
├── products.html       # 商品查詢系統主頁面
├── qrcode.html        # 產品頁面（原有功能）
├── image.png          # 公司圖片
└── README.md          # 說明文件
```

## 技術說明

- **純前端實現**：使用 HTML、CSS、JavaScript
- **無需後端**：直接從 Google Sheets API 讀取資料
- **資料格式**：使用 Google Visualization API (gviz)
- **儲存機制**：使用 localStorage 記住設定

## Google Sheets API 限制

- Google Sheet 必須設為公開或可共享連結
- 建議商品數量控制在 1000 筆以內以確保載入速度
- 資料更新後需重新載入頁面

## 瀏覽器支援

- Chrome / Edge (推薦)
- Firefox
- Safari
- 支援所有現代瀏覽器

## 常見問題

### Q: 為什麼無法載入 Google Sheet？
A: 請確認：
1. Google Sheet 已設為「知道連結的人皆可查看」
2. 網址格式正確（包含 `/d/[SHEET_ID]/`）
3. 網路連線正常

### Q: 如何更新商品資料？
A: 直接在 Google Sheet 中修改，然後在網頁上點選「重新載入」即可。

### Q: 可以使用私人的 Google Sheet 嗎？
A: 不行，由於是純前端實現，無法處理需要認證的私人試算表。必須設為公開分享。

### Q: 搜尋支援哪些欄位？
A: 支援搜尋商品編號、商品名稱、售價、條碼等所有欄位。

## 授權

此專案為橙興生活文創有限公司專用。

## 聯絡資訊

如有問題或建議，請聯繫網站管理員。
