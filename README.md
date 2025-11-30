# 橙興生活文創 - 進銷存管理系統

橙興生活文創的進銷存管理系統，整合商品查詢、庫存管理、進貨銷貨作業與報表分析。

## 🌟 功能特色

### 核心功能
- 📦 **庫存管理** - 即時監控庫存狀態，自動警示低庫存商品
- 📥 **進貨作業** - 供應商管理、進貨單建立、自動更新庫存
- 💰 **銷貨作業** - POS 介面、條碼掃描、購物車結帳
- 📊 **報表中心** - 銷售分析、熱銷商品、進銷存報表
- ⚙️ **系統管理** - 使用者權限、供應商管理、系統設定

### 商品查詢（舊有功能）
- 📋 連接 Google Sheets 讀取商品資料
- 🔍 即時搜尋商品（支援商品編號、名稱、售價、條碼）
- 📱 響應式設計，支援手機、平板、桌面裝置

### 技術特點
- 🔐 **角色權限控制** - 三級權限（admin/manager/staff）
- 🌐 **純前端架構** - GitHub Pages 免費託管
- 🗄️ **Supabase 後端** - 免費 PostgreSQL + 認證服務
- 📱 **響應式設計** - 支援各種裝置

## 使用方式

### 1. 準備 Google Sheet

建立一個 Google 試算表，第一列為標題列，包含以下欄位：

| 商品編號 | 商品名稱 | 售價 | 條碼 |
|---------|---------|------|------|
| P001    | 商品A   | 100  | 1234567890 |
| P002    | 商品B   | 200  | 0987654321 |

**重要：** 標題列必須包含「編號」、「名稱」、「價」、「條碼」等關鍵字

### 設定 Google Sheet 分享權限

1. 開啟您的 Google Sheet
2. 點選右上角「共用」按鈕
3. 點選「取得連結」
4. 將權限設定為「知道連結的人皆可查看」
5. 複製分享連結

---

## ❓ 常見問題

### 進銷存系統相關

**Q: 為什麼登入後顯示「權限不足」？**
A: 請確認在 Supabase 的 `user_roles` 資料表中已設定使用者角色。

**Q: 可以同時使用 Google Sheets 和 Supabase 嗎？**
A: 可以！商品查詢頁面支援雙模式，可以讓訪客使用 Google Sheets 查詢，員工登入後使用完整進銷存功能。

### Google Sheets 相關

**Q: 為什麼無法載入 Google Sheet？**
A: 請確認 Google Sheet 已設為「知道連結的人皆可查看」。

**Q: 如何更新商品資料？**
A: 直接在 Google Sheet 中修改，然後在網頁上點選「重新載入」即可。

---

## 📜 版本歷史

- **v3.0** (2024-11) - 加入完整進銷存系統、Supabase 整合
- **v2.0** (2024-10) - 商品查詢系統優化
- **v1.0** (2024-09) - 初始版本，Google Sheets 商品查詢

## 📁 檔案結構

```
orengioneweb/
├── index.html          # 首頁
├── login.html          # 登入頁面
├── products.html       # 商品查詢（整合認證）
├── inventory.html      # 庫存管理
├── purchase.html       # 進貨作業
├── sales.html          # 銷貨作業（POS）
├── reports.html        # 報表中心
├── admin.html          # 系統管理
├── qrcode.html         # 產品頁面（原有功能）
├── js/
│   ├── config.js       # 設定檔（Supabase 連線）
│   ├── supabase-client.js  # Supabase 客戶端
│   ├── auth.js         # 認證模組
│   └── utils.js        # 工具函式
├── sql/
│   ├── 001_create_tables.sql  # 資料表建立腳本
│   └── 002_seed_data.sql      # 測試資料腳本
├── docs/
│   ├── SUPABASE_SETUP.md      # Supabase 設定指南
│   └── DEPLOYMENT.md          # GitHub Pages 部署指南
├── spec.md             # 系統規格書
└── README.md           # 說明文件
```

## 🚀 快速開始

### 方式一：僅使用商品查詢（Google Sheets）

無需設定 Supabase，直接使用 Google Sheets 功能：

1. 開啟 `products.html`
2. 貼上 Google Sheet 分享連結
3. 開始查詢商品

### 方式二：完整進銷存系統（需設定 Supabase）

1. **設定 Supabase** - 參考 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
2. **更新設定檔** - 修改 `js/config.js` 中的連線資訊
3. **執行 SQL** - 在 Supabase SQL Editor 執行 `sql/` 資料夾中的腳本
4. **建立使用者** - 在 Supabase 建立帳號並設定角色
5. **部署** - 參考 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 👥 使用者角色

| 角色 | 權限 |
|------|------|
| **admin** | 所有功能 + 系統管理 |
| **manager** | 進銷存 + 報表 |
| **staff** | 庫存查詢 + 進銷貨作業 |
| **訪客** | 僅商品查詢（Google Sheets 模式） |

## 📖 文件

- [系統規格書](spec.md) - 完整技術規格與資料庫設計
- [Supabase 設定指南](docs/SUPABASE_SETUP.md) - 後端設定步驟
- [部署指南](docs/DEPLOYMENT.md) - GitHub Pages 部署說明

## 🛠️ 技術堆疊

| 項目 | 技術 |
|------|------|
| 前端 | HTML5, CSS3, JavaScript (ES6+) |
| 後端 | Supabase (PostgreSQL + Auth + RLS) |
| 託管 | GitHub Pages |
| 認證 | Supabase Auth (Email/Password) |

## 📊 資料庫結構

主要資料表：
- `products` - 商品資料
- `suppliers` - 供應商
- `purchase_orders` / `purchase_items` - 進貨單
- `sales_orders` / `sales_items` - 銷售單
- `inventory_logs` - 庫存異動紀錄
- `user_roles` - 使用者角色
- `audit_logs` - 稽核日誌

詳細規格請參考 [spec.md](spec.md)。

---

## 📋 原有 Google Sheets 功能（保留使用）

### 準備 Google Sheet

建立一個 Google 試算表，第一列為標題列，包含以下欄位：

| 商品編號 | 商品名稱 | 售價 | 條碼 |
|---------|---------|------|------|
| P001    | 商品A   | 100  | 1234567890 |
| P002    | 商品B   | 200  | 0987654321 |

**重要：** 標題列必須包含「編號」、「名稱」、「價」、「條碼」等關鍵字

## 授權

此專案為橙興生活文創有限公司專用。

## 聯絡資訊

如有問題或建議，請聯繫網站管理員。
