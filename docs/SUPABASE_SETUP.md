# Supabase 設定指南

本文件說明如何設定 Supabase 專案以支援橙興生活文創進銷存系統。

## 目錄

1. [建立 Supabase 專案](#1-建立-supabase-專案)
2. [取得連線資訊](#2-取得連線資訊)
3. [執行資料庫腳本](#3-執行資料庫腳本)
4. [設定認證](#4-設定認證)
5. [建立測試使用者](#5-建立測試使用者)
6. [更新前端設定](#6-更新前端設定)
7. [驗證設定](#7-驗證設定)
8. [常見問題](#8-常見問題)

---

## 1. 建立 Supabase 專案

### 步驟 1.1：註冊/登入 Supabase

1. 前往 [https://supabase.com](https://supabase.com)
2. 點選 **Start your project**
3. 使用 GitHub 帳號登入（推薦）或建立新帳號

### 步驟 1.2：建立新專案

1. 在 Dashboard 點選 **New Project**
2. 填寫專案資訊：
   - **Organization**: 選擇或建立組織
   - **Project Name**: `orengione-inventory`（或自訂名稱）
   - **Database Password**: 設定強密碼（請妥善保存！）
   - **Region**: 選擇 `Northeast Asia (Tokyo)` 以獲得較佳的連線速度
3. 點選 **Create new project**
4. 等待約 2 分鐘讓專案初始化完成

---

## 2. 取得連線資訊

### 步驟 2.1：找到 API 設定

1. 在專案 Dashboard 左側選單點選 **Settings** (齒輪圖示)
2. 選擇 **API**

### 步驟 2.2：複製必要資訊

您需要以下兩個值：

| 項目 | 說明 | 範例 |
|------|------|------|
| **Project URL** | 專案的 API 網址 | `https://xyzabcdef.supabase.co` |
| **anon public** | 公開 API 金鑰 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

⚠️ **注意**：
- `anon public` 金鑰可以安全地放在前端程式碼中
- `service_role` 金鑰**絕對不要**放在前端程式碼！

---

## 3. 執行資料庫腳本

### 步驟 3.1：開啟 SQL 編輯器

1. 在 Dashboard 左側選單點選 **SQL Editor**
2. 點選 **New Query**

### 步驟 3.2：執行資料表建立腳本

1. 開啟專案中的 `sql/001_create_tables.sql` 檔案
2. 複製全部內容
3. 貼到 SQL Editor 中
4. 點選 **Run** 或按 `Ctrl/Cmd + Enter`
5. 確認執行成功（應該看到 "Success. No rows returned"）

### 步驟 3.3：執行種子資料腳本（選用）

如需測試資料：

1. 開啟 `sql/002_seed_data.sql`
2. 複製並貼到新的 Query
3. 執行腳本

### 步驟 3.4：驗證資料表

1. 在左側選單點選 **Table Editor**
2. 確認以下資料表已建立：
   - `products` - 商品資料
   - `suppliers` - 供應商資料
   - `purchase_orders` - 進貨單
   - `purchase_items` - 進貨明細
   - `sales_orders` - 銷售單
   - `sales_items` - 銷售明細
   - `inventory_logs` - 庫存異動紀錄
   - `user_roles` - 使用者角色
   - `audit_logs` - 稽核日誌

---

## 4. 設定認證

### 步驟 4.1：設定 Email 認證

1. 在 Dashboard 左側選單點選 **Authentication**
2. 選擇 **Providers**
3. 確認 **Email** 已啟用
4. 可選擇關閉 **Confirm email**（開發階段建議關閉以簡化測試）

### 步驟 4.2：設定網站 URL

1. 在 Authentication 選單中選擇 **URL Configuration**
2. 設定：
   - **Site URL**: `https://your-username.github.io/orengioneweb`（GitHub Pages 網址）
   - **Redirect URLs**: 加入 `http://localhost:*` 和您的 GitHub Pages 網址

### 步驟 4.3：關閉 Email 確認（開發用）

開發階段建議暫時關閉：

1. 進入 **Authentication** > **Settings**
2. 找到 **Enable email confirmations**
3. 暫時關閉（部署前記得重新啟用！）

---

## 5. 建立測試使用者

### 步驟 5.1：建立管理員帳號

1. 在 **Authentication** > **Users** 點選 **Add user** > **Create new user**
2. 輸入：
   - Email: `admin@orange.com`
   - Password: `Admin123!`（請更換為安全密碼）
3. 點選 **Create user**

### 步驟 5.2：設定使用者角色

在 SQL Editor 執行：

```sql
-- 取得剛建立的使用者 ID
SELECT id, email FROM auth.users WHERE email = 'admin@orange.com';

-- 複製上面查詢結果的 id，替換下方的 'YOUR_USER_ID'
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

### 步驟 5.3：建立其他測試帳號（選用）

```sql
-- 在建立其他使用者後，設定角色
-- 主管
INSERT INTO user_roles (user_id, role)
VALUES ('MANAGER_USER_ID', 'manager');

-- 員工
INSERT INTO user_roles (user_id, role)
VALUES ('STAFF_USER_ID', 'staff');
```

---

## 6. 更新前端設定

### 步驟 6.1：修改 config.js

開啟 `js/config.js`，更新以下設定：

```javascript
const APP_CONFIG = {
    // 將這兩個值替換為您的 Supabase 專案資訊
    SUPABASE_URL: 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    
    // 啟用 Supabase（改為 true）
    ENABLE_SUPABASE: true,
    
    // 其他設定保持不變...
};
```

### 步驟 6.2：本地測試

1. 使用 VS Code Live Server 或其他本地伺服器啟動專案
2. 開啟瀏覽器前往 `http://localhost:5500`（或您的本地伺服器埠號）
3. 測試登入功能

---

## 7. 驗證設定

### 檢查清單

完成以上設定後，請驗證：

- [ ] 可以開啟登入頁面
- [ ] 可以使用 admin 帳號登入
- [ ] 登入後導航列顯示使用者資訊
- [ ] 可以存取庫存管理頁面
- [ ] 可以存取進貨/銷貨作業頁面
- [ ] admin 帳號可以存取系統管理頁面
- [ ] 登出功能正常運作

### 瀏覽器開發者工具

如遇到問題，開啟瀏覽器開發者工具（F12）：

1. **Console** 標籤：檢查是否有錯誤訊息
2. **Network** 標籤：檢查 API 請求是否成功
3. **Application** > **Local Storage**：檢查 session 資料

---

## 8. 常見問題

### Q1: 登入時出現 "Invalid login credentials"

**可能原因**：
- 密碼輸入錯誤
- Email 確認未完成（如果啟用了 email 確認）
- 使用者不存在

**解決方案**：
1. 確認密碼正確
2. 在 Supabase Dashboard 確認使用者存在
3. 暫時關閉 email 確認設定

### Q2: 登入成功但頁面顯示「權限不足」

**可能原因**：
- 使用者角色未設定
- user_roles 資料表中沒有對應記錄

**解決方案**：
```sql
-- 檢查使用者角色
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';

-- 如果沒有記錄，新增角色
INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
```

### Q3: API 請求回傳 401 或 403 錯誤

**可能原因**：
- RLS (Row Level Security) 政策問題
- API 金鑰錯誤

**解決方案**：
1. 確認 `config.js` 中的 `SUPABASE_ANON_KEY` 正確
2. 在 Supabase Dashboard 檢查 RLS 政策

### Q4: 資料表顯示「relation does not exist」

**可能原因**：
- SQL 腳本未執行或執行失敗

**解決方案**：
1. 重新執行 `001_create_tables.sql`
2. 檢查 SQL Editor 的錯誤訊息

### Q5: CORS 錯誤

**可能原因**：
- 本地開發時使用 file:// 協定

**解決方案**：
使用本地伺服器（如 VS Code Live Server）而非直接開啟 HTML 檔案

---

## 附錄：環境設定備忘

| 項目 | 值 |
|------|-----|
| Supabase Project URL | `________________________` |
| Supabase Anon Key | `________________________` |
| Admin Email | `________________________` |
| GitHub Pages URL | `________________________` |

---

## 下一步

設定完成後，您可以：

1. 📦 在「庫存管理」頁面新增商品
2. 🏭 在「系統管理」設定供應商
3. 📥 建立進貨單測試進貨流程
4. 💰 使用 POS 介面測試銷售流程
5. 📊 查看報表確認資料正確

如有問題，請參考 [spec.md](../spec.md) 中的技術規格。
