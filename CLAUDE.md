# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

橙興生活文創 (Orengione) - 一個整合 Google Sheets 的靜態網站商品目錄系統。部署於 GitHub Pages，無需後端伺服器。

## 架構說明

### 核心組件

**靜態 HTML 頁面（無建置流程）**
- `index.html` - 首頁，包含導航至各產品系統
- `products.html` - 主要商品查詢/目錄介面，整合 Google Sheets
- `qrcode.html` - 舊版產品重新導向頁面（使用 products.json 進行 URL 對應）

### 資料流架構

**Google Sheets 整合（products.html）**
1. 使用者提供 Google Sheets 分享網址
2. 透過正規表達式提取 Sheet ID：`/\/d\/([a-zA-Z0-9-_]+)/`
3. 從 Google Visualization API 取得資料：`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
4. 解析 JSONP 回應（移除包裝：`text.substring(47).slice(0, -2)`）
5. 資料快取於 localStorage，鍵值為：`sheetUrl`, `sheetId`
6. 標題列自動偵測透過關鍵字：'編號', '名稱', '價', '條碼'

**客戶端搜尋**
- 所有過濾皆在記憶體中使用 JavaScript Array.filter() 處理
- 搜尋涵蓋所有商品欄位（編號、名稱、售價、條碼）
- 不區分大小寫的比對，使用 String.toLowerCase()

### Google Sheets 資料契約

**必要欄位標題**（第一列）
必須包含中文關鍵字以供自動偵測：
- 商品編號 - 關鍵字：'編號'
- 商品名稱 - 關鍵字：'名稱'
- 售價 - 關鍵字：'價'
- 條碼 - 關鍵字：'條碼'

**試算表權限設定**
必須設定為「知道連結的人皆可查看」

## 開發流程

### 本地測試

**啟動本地伺服器**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (如已安裝 http-server)
npx http-server -p 8000
```

存取位址：`http://localhost:8000/`

### 部署

**自動部署**
- 推送至 `main` 分支會觸發 GitHub Actions workflow
- Workflow 檔案：`.github/workflows/jekyll-gh-pages.yml`
- 使用 Jekyll 建置並部署至 GitHub Pages
- 根目錄有 `.nojekyll` 檔案以停用 Jekyll 處理靜態檔案

**手動部署**
也可透過 GitHub Actions UI 手動觸發（workflow_dispatch）

### 測試 Google Sheets 整合

1. 建立測試用 Google Sheet，包含正確標題列
2. 設定分享為「知道連結的人皆可查看」
3. 複製分享網址（格式：`https://docs.google.com/spreadsheets/d/SHEET_ID/edit...`）
4. 貼入 products.html 介面
5. 驗證資料正確載入

## 程式碼慣例

### JavaScript 模式

**狀態管理**
- 全域狀態儲存於 `productsData` 陣列（products.html:323）
- 使用 localStorage 進行跨會話持久化
- 無框架依賴 - 僅使用原生 JavaScript

**HTML 跳脫**
顯示使用者/試算表資料時，務必使用 `escapeHtml()` 函式以防止 XSS：
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

**錯誤處理模式**
```javascript
try {
    // API 呼叫
} catch (error) {
    console.error('Error:', error);
    messageDiv.innerHTML = '<div class="error">載入失敗：' + error.message + '</div>';
}
```

### CSS 架構

**樣式設計方式**
- 內嵌 `<style>` 區塊（無外部 CSS 檔案）
- 行動優先響應式設計，使用 `@media (max-width: 768px)`
- 商品卡片使用 CSS Grid：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- 漸層背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

## 重要限制

1. **無建置系統** - 純 HTML/CSS/JS，無轉譯或打包
2. **無後端** - 所有資料來自 Google Sheets API，無伺服器端處理
3. **僅限公開資料** - 無法使用私人 Google Sheets（CORS/認證限制）
4. **中文語系** - 所有 UI 文字與文件使用繁體中文
5. **瀏覽器相容性** - 僅支援現代瀏覽器（使用 ES6+ 功能）

## 常見任務

### 新增商品搜尋功能

直接編輯 `products.html`。關鍵函式：
- `loadSheet()` - 取得並解析 Google Sheets 資料
- `parseSheetData(data)` - 將 API 回應轉換為商品物件
- `searchProducts()` - 根據搜尋輸入過濾商品
- `displayProducts(products)` - 渲染商品網格

### 修改商品卡片顯示

商品卡片樣板位於 products.html:440-446。在 `displayProducts()` 函式內更新樣板字串。

### 變更試算表欄位對應

修改 `parseSheetData()` 中的標題偵測邏輯（products.html:400-403）。更新 `findIndex()` 呼叫，使用新的關鍵字模式。

## 疑難排解

### Google Sheets 無法載入

檢查：
1. 試算表分享權限設定正確
2. 網址格式有效（包含 `/d/SHEET_ID/`）
3. 瀏覽器網路標籤中的 CORS 錯誤
4. 第一列包含必要的中文關鍵字

### 搜尋功能無作用

檢查 `searchProducts()` 函式，確保所有商品欄位在呼叫 `.toLowerCase()` 前已轉為字串

### GitHub Pages 404 錯誤

- 確認根目錄存在 `.nojekyll` 檔案
- 檢查 GitHub 儲存庫 Settings → Pages → Source 設定為 main 分支
- 推送後等待 2-5 分鐘以完成部署
