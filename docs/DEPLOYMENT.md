# GitHub Pages 部署指南

本文件說明如何將橙興生活文創進銷存系統部署到 GitHub Pages。

## 目錄

1. [前置準備](#1-前置準備)
2. [上傳至 GitHub](#2-上傳至-github)
3. [啟用 GitHub Pages](#3-啟用-github-pages)
4. [更新 Supabase 設定](#4-更新-supabase-設定)
5. [驗證部署](#5-驗證部署)
6. [自訂網域（選用）](#6-自訂網域選用)
7. [持續更新](#7-持續更新)

---

## 1. 前置準備

### 1.1 確認檔案結構

部署前請確認專案包含以下檔案：

```
orengioneweb/
├── index.html          # 首頁
├── login.html          # 登入頁面
├── products.html       # 商品查詢
├── inventory.html      # 庫存管理
├── purchase.html       # 進貨作業
├── sales.html          # 銷貨作業
├── reports.html        # 報表中心
├── admin.html          # 系統管理
├── js/
│   ├── config.js       # ⚠️ 需要更新連線資訊
│   ├── supabase-client.js
│   ├── auth.js
│   └── utils.js
└── ...
```

### 1.2 更新設定檔

**重要**：在部署前，請確認 `js/config.js` 已更新：

```javascript
const APP_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',  // ← 您的 Supabase URL
    SUPABASE_ANON_KEY: 'your-anon-key',                // ← 您的 Anon Key
    ENABLE_SUPABASE: true,                              // ← 改為 true
    // ...
};
```

---

## 2. 上傳至 GitHub

### 2.1 建立 GitHub Repository

1. 登入 [GitHub](https://github.com)
2. 點選右上角 **+** > **New repository**
3. 設定：
   - **Repository name**: `orengioneweb`
   - **Visibility**: Public（GitHub Pages 免費版需公開）
   - 不要勾選 "Add a README file"
4. 點選 **Create repository**

### 2.2 推送程式碼

在終端機執行：

```bash
# 如果尚未初始化 Git
git init

# 設定遠端 repository（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/orengioneweb.git

# 加入所有檔案
git add .

# 提交
git commit -m "Initial commit: 進銷存系統"

# 推送到 GitHub
git push -u origin main
```

如果您正在使用 `feature/inventory-system-v3` 分支：

```bash
# 合併到 main
git checkout main
git merge feature/inventory-system-v3

# 推送
git push origin main
```

---

## 3. 啟用 GitHub Pages

### 3.1 進入設定頁面

1. 前往您的 GitHub repository
2. 點選 **Settings** 標籤
3. 在左側選單找到 **Pages**

### 3.2 設定部署來源

1. 在 **Source** 區塊，選擇：
   - **Branch**: `main`
   - **Folder**: `/ (root)`
2. 點選 **Save**

### 3.3 等待部署

- GitHub 會自動開始部署
- 約 1-2 分鐘後，頁面會顯示您的網站 URL
- URL 格式：`https://YOUR_USERNAME.github.io/orengioneweb/`

---

## 4. 更新 Supabase 設定

部署完成後，需要更新 Supabase 的安全設定：

### 4.1 新增 Redirect URL

1. 前往 Supabase Dashboard
2. **Authentication** > **URL Configuration**
3. 在 **Redirect URLs** 新增：
   ```
   https://YOUR_USERNAME.github.io/orengioneweb/**
   ```

### 4.2 更新 Site URL

1. 在同一頁面，更新 **Site URL**：
   ```
   https://YOUR_USERNAME.github.io/orengioneweb
   ```

### 4.3 檢查 RLS 政策

確認資料表的 Row Level Security 政策允許認證使用者存取。

---

## 5. 驗證部署

### 5.1 檢查清單

- [ ] 網站可正常開啟
- [ ] 登入頁面可正常顯示
- [ ] 可以成功登入
- [ ] 登入後可存取各功能頁面
- [ ] 資料可正常讀取
- [ ] RWD 響應式設計正常

### 5.2 常見問題

#### 404 錯誤

- 確認檔案名稱大小寫正確（GitHub Pages 區分大小寫）
- 確認 `index.html` 存在於根目錄

#### 樣式或腳本載入失敗

- 檢查路徑是否使用相對路徑
- 確認沒有使用 `/` 開頭的絕對路徑

#### 登入失敗

- 檢查 Supabase Redirect URL 設定
- 開啟瀏覽器開發者工具查看錯誤

---

## 6. 自訂網域（選用）

如果您有自己的網域：

### 6.1 在 GitHub 設定

1. 在 **Settings** > **Pages** > **Custom domain**
2. 輸入您的網域，例如 `inventory.yourcompany.com`
3. 點選 **Save**

### 6.2 在 DNS 設定

根據您的 DNS 供應商，新增以下記錄：

**A 記錄**（根網域）：
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME 記錄**（子網域）：
```
inventory.yourcompany.com → YOUR_USERNAME.github.io
```

### 6.3 啟用 HTTPS

1. 等待 DNS 生效（可能需要 24-48 小時）
2. 在 GitHub Pages 設定勾選 **Enforce HTTPS**

### 6.4 更新 Supabase

記得在 Supabase 新增自訂網域到 Redirect URLs。

---

## 7. 持續更新

### 7.1 更新流程

每次修改程式碼後：

```bash
# 加入變更
git add .

# 提交
git commit -m "更新說明"

# 推送
git push origin main
```

GitHub Pages 會自動重新部署（約 1-2 分鐘）。

### 7.2 查看部署狀態

1. 前往 repository 的 **Actions** 標籤
2. 查看 "pages build and deployment" workflow

### 7.3 回滾版本

如需回滾：

```bash
# 查看提交歷史
git log --oneline

# 回滾到特定版本
git revert <commit-hash>
git push origin main
```

---

## 附錄：部署備忘

| 項目 | 值 |
|------|-----|
| GitHub Repository | `________________________` |
| GitHub Pages URL | `________________________` |
| 自訂網域（如有） | `________________________` |
| 部署日期 | `________________________` |

---

## 相關文件

- [Supabase 設定指南](./SUPABASE_SETUP.md)
- [系統規格書](../spec.md)
- [README](../README.md)
