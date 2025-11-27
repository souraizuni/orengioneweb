# Orengione 產品管理系統 v2.0 規格文件

**版本**: 2.0  
**日期**: 2025年11月17日  
**作者**: Orengione 開發團隊  
**狀態**: 進行中

---

## 1. 系統概述

### 1.1 背景與現況

Orengione（橙興生活文創）目前運行產品查詢系統 v1.0：
- **部署平台**: GitHub Pages (靜態網站)
- **資料來源**: Google Sheets (公開試算表)
- **功能**: 快速查詢、進階搜尋、條碼顯示

**現有系統的限制**:
1. 資料安全風險：Google Sheets 公開，任何人可檢視/修改
2. 無法管理：無管理員系統，無法添加/編輯產品
3. 無認證機制：所有使用者權限相同，無隱私控制
4. 可擴展性限制：Google Sheets API 有速率限制

### 1.2 專案目標

遷移至 Supabase 後端，實現：

| 目標 | 詳細說明 |
|------|--------|
| **安全性** | 使用行級安全政策 (RLS) 保護敏感資料 |
| **認證系統** | 用戶登入/登出，角色管理 (管理員/檢視者) |
| **產品管理** | 完整 CRUD 介面，只有管理員可編輯 |
| **效能** | 維持既有快速查詢功能，支援 1000+ 產品 |
| **成本** | 100% 使用免費方案，零成本運營 |
| **可維護性** | 清晰文件與架構，便於團隊開發與維護 |

### 1.3 核心需求

**功能需求 (FR)**:
- FR-1: 管理員可管理產品 (新增/編輯/刪除)
- FR-2: 一般使用者可快速查詢產品
- FR-3: 所有操作記錄於審計日誌
- FR-4: 使用者認證與授權管理
- FR-5: 支援產品分類與篩選

**非功能需求 (NFR)**:
- NFR-1: 50ms 內完成查詢 (< 100ms 可接受)
- NFR-2: 支援同時 100+ 用戶訪問
- NFR-3: 99% 可用性（每月停機時間 < 7 小時）
- NFR-4: RLS 強制所有資料存取權限

---

## 2. 技術架構

### 2.1 高層架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (靜態)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           index.html / products.html                │  │
│  │  (HTML + CSS + JavaScript ES6+)                     │  │
│  │  ┌─ 快速查詢模式 (QWERTY鍵盤)                         │  │
│  │  ├─ 進階搜尋模式                                     │  │
│  │  ├─ 管理介面模式 (需登入)                            │  │
│  │  └─ 認證模式 (登入/登出)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API 呼叫
                           │ (Supabase JS SDK)
                           │
        ┌──────────────────▼──────────────────┐
        │      Supabase 後端 (PostgreSQL)     │
        │  ┌──────────────────────────────┐  │
        │  │  認證系統 (JWT)              │  │
        │  ├──────────────────────────────┤  │
        │  │  資料庫表 (RLS 保護)         │  │
        │  │  ├─ products               │  │
        │  │  ├─ user_roles             │  │
        │  │  └─ audit_logs             │  │
        │  └──────────────────────────────┘  │
        └─────────────────────────────────────┘
```

### 2.2 技術棧對比

| 面向 | Supabase | Firebase | MongoDB Atlas |
|------|----------|----------|---------------|
| **免費資料庫大小** | 500MB | 1GB (即時) | 512MB (M0) |
| **RLS 支持** | ✅ 原生 PostgreSQL | ⚠️ 自訂規則 | ❌ 手動認證 |
| **認證簡易性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **API 無限制** | ✅ 無限 | ⚠️ 讀寫計次 | ⚠️ 計次有限 |
| **冷啟動風險** | ⬇️ 低 | ⬇️ 低 | ⬇️ 低 |
| **推薦程度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**選擇 Supabase 的原因**:
1. 原生 PostgreSQL 支持複雜查詢
2. RLS 在資料庫層強制執行權限 (最安全)
3. 免費方案足夠 v1.0 升級 (500MB >> ~5MB 初始資料)
4. JWT 認證與 GitHub Pages 兼容
5. 無冷啟動問題，API 無限制

### 2.3 部署架構

```
GitHub Repository (主分支)
    │
    ├─ HTML/CSS/JS 檔案
    │  ├─ index.html (首頁)
    │  ├─ products.html (主應用)
    │  ├─ qrcode.html (QR 碼重導)
    │  ├─ css/ (樣式表)
    │  └─ js/ (JavaScript 模組)
    │
    ├─ 組態檔案
    │  ├─ .github/workflows/jekyll-gh-pages.yml
    │  └─ .nojekyll (禁用 Jekyll)
    │
    └─ 文件
       ├─ README.md (基本說明)
       ├─ CLAUDE.md (AI 提示詞)
       └─ spec.md (本文件)
           │
           ▼
    GitHub Pages 發布
    (https://souraizuni.github.io/orengioneweb/)
           │
           ▼
    Supabase API 呼叫
    (JWT 認證)
           │
           ▼
    PostgreSQL 執行
    (RLS 政策強制權限)
```

---

## 3. 資料模型與資料庫設計

### 3.1 產品表 (products)

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,           -- 產品編號 (例: "ORG001")
  name VARCHAR(255) NOT NULL,                 -- 產品名稱
  price DECIMAL(10, 2) NOT NULL,              -- 售價 (NT$)
  barcode VARCHAR(50) UNIQUE,                 -- 國際條碼
  category VARCHAR(100),                      -- 商品分類
  description TEXT,                           -- 產品描述
  created_at TIMESTAMP DEFAULT NOW(),         -- 建立時間
  updated_at TIMESTAMP DEFAULT NOW(),         -- 更新時間
  created_by UUID REFERENCES auth.users(id),  -- 建立者
  updated_by UUID REFERENCES auth.users(id)   -- 更新者
);

-- 建立索引加快查詢
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
```

**RLS 政策**:
```sql
-- 所有人可讀取產品
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理員與檢視者都能讀取產品"
  ON products FOR SELECT
  USING (true);

-- 只有管理員可插入
CREATE POLICY "只有管理員可新增產品"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 只有管理員可更新
CREATE POLICY "只有管理員可編輯產品"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 只有管理員可刪除
CREATE POLICY "只有管理員可刪除產品"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3.2 使用者角色表 (user_roles)

```sql
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'viewer')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- 建立索引
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

**RLS 政策**:
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 使用者可檢視自己的角色
CREATE POLICY "使用者可檢視自己的角色"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 只有管理員可檢視所有角色
CREATE POLICY "管理員可檢視所有角色"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 只有管理員可分配角色
CREATE POLICY "只有管理員可分配角色"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3.3 審計日誌表 (audit_logs)

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,              -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  table_name VARCHAR(50),                   -- 受影響的表
  record_id BIGINT,                         -- 受影響的記錄 ID
  old_values JSONB,                         -- 變更前的值
  new_values JSONB,                         -- 變更後的值
  ip_address INET,                          -- 使用者 IP
  created_at TIMESTAMP DEFAULT NOW()        -- 時間戳
);

-- 建立索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**自動觸發器** (記錄所有產品變更):
```sql
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id,
    old_values, new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    'products',
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER products_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_product_changes();
```

---

## 4. 功能需求詳細規格

### FR-1: 管理員產品管理

**使用案例**: 管理員登入後，可新增/編輯/刪除產品

**新增產品**:
```javascript
async function addProduct(formData) {
  // 驗證管理員身份
  const user = await getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const role = await getUserRole(user.id);
  if (role !== 'admin') throw new Error('無權限');
  
  // 呼叫 Supabase
  const { data, error } = await supabase
    .from('products')
    .insert([{
      code: formData.code.toUpperCase(),
      name: formData.name,
      price: parseFloat(formData.price),
      barcode: formData.barcode || null,
      category: formData.category,
      description: formData.description || null
    }])
    .select();
  
  if (error) throw new Error(`新增失敗: ${error.message}`);
  return data[0];
}
```

**編輯產品**:
```javascript
async function updateProduct(productId, formData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const role = await getUserRole(user.id);
  if (role !== 'admin') throw new Error('無權限');
  
  const { data, error } = await supabase
    .from('products')
    .update({
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      description: formData.description || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', productId)
    .select();
  
  if (error) throw new Error(`編輯失敗: ${error.message}`);
  return data[0];
}
```

**刪除產品**:
```javascript
async function deleteProduct(productId) {
  const user = await getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const role = await getUserRole(user.id);
  if (role !== 'admin') throw new Error('無權限');
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  
  if (error) throw new Error(`刪除失敗: ${error.message}`);
}
```

### FR-2: 一般使用者快速查詢

**使用案例**: 訪客可快速查詢產品，無需登入

**快速搜尋實現**:
```javascript
// 保留既有的 QWERTY 鍵盤邏輯
async function quickSearch(query) {
  if (!query) return [];
  
  // 從 Supabase 取得所有產品 (公開查詢)
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('code');
  
  if (error) throw error;
  
  // 客戶端模糊匹配 (保持既有速度優勢)
  const results = data.filter(p => 
    p.code.includes(query) || 
    p.name.includes(query)
  );
  
  return results;
}
```

### FR-3: 審計日誌

**自動記錄所有變更**:
- 每次產品新增/編輯/刪除自動寫入 audit_logs
- 觸發器記錄舊值與新值 (變更追蹤)
- 包含時間戳、執行者、IP 位址

**查詢審計日誌** (僅管理員):
```javascript
async function getAuditLogs(filters = {}) {
  const user = await getCurrentUser();
  const role = await getUserRole(user.id);
  if (role !== 'admin') throw new Error('無權限');
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### FR-4: 認證與授權

**登入流程**:
```javascript
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw new Error(`登入失敗: ${error.message}`);
  
  // 儲存 JWT token
  localStorage.setItem('auth_token', data.session.access_token);
  localStorage.setItem('user_id', data.user.id);
  
  // 取得使用者角色
  const role = await getUserRole(data.user.id);
  localStorage.setItem('user_role', role);
  
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return user;
}

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  return data?.role || 'viewer';
}
```

### FR-5: 分類與篩選

**支援產品分類篩選**:
```javascript
async function getProductsByCategory(category) {
  let query = supabase.from('products').select('*');
  
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('code');
  if (error) throw error;
  return data;
}

async function getCategories() {
  const { data, error } = await supabase
    .from('products')
    .select('category', { count: 'exact' })
    .neq('category', null);
  
  if (error) throw error;
  
  // 去重
  const categories = [...new Set(data.map(p => p.category))];
  return categories.sort();
}
```

---

## 5. API 規格

### 5.1 認證端點

**登入** (POST)
```
請求:
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "secure_password"
}

回應 (200 OK):
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**登出** (POST)
```
請求:
POST /auth/v1/logout
Authorization: Bearer {access_token}

回應 (200 OK):
{ "message": "已登出" }
```

### 5.2 產品端點

**列表所有產品** (GET)
```
請求:
GET /rest/v1/products?select=*&order=code.asc

回應 (200 OK):
[
  {
    "id": 1,
    "code": "ORG001",
    "name": "產品名稱",
    "price": 1299.00,
    "barcode": "4710xxx...",
    "category": "分類1",
    "created_at": "2025-11-17T10:00:00Z"
  },
  ...
]
```

**建立產品** (POST) - 需管理員
```
請求:
POST /rest/v1/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "ORG002",
  "name": "新產品",
  "price": 1599.99,
  "barcode": "4710xxx...",
  "category": "分類2",
  "description": "產品說明"
}

回應 (201 Created):
{
  "id": 2,
  "code": "ORG002",
  "name": "新產品",
  "price": 1599.99,
  "created_at": "2025-11-17T11:00:00Z"
}
```

**更新產品** (PATCH) - 需管理員
```
請求:
PATCH /rest/v1/products?id=eq.1
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "更新名稱",
  "price": 1499.99
}

回應 (200 OK):
{
  "id": 1,
  "name": "更新名稱",
  "price": 1499.99,
  "updated_at": "2025-11-17T12:00:00Z"
}
```

**刪除產品** (DELETE) - 需管理員
```
請求:
DELETE /rest/v1/products?id=eq.1
Authorization: Bearer {admin_token}

回應 (204 No Content):
```

### 5.3 審計端點

**查詢審計日誌** (GET) - 需管理員
```
請求:
GET /rest/v1/audit_logs?select=*&order=created_at.desc

回應 (200 OK):
[
  {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "action": "INSERT",
    "table_name": "products",
    "record_id": 1,
    "old_values": null,
    "new_values": { "code": "ORG001", "name": "...", "price": 1299.00 },
    "created_at": "2025-11-17T10:00:00Z"
  },
  ...
]
```

---

## 6. 前端架構

### 6.1 檔案結構

```
orengioneweb/
├── index.html                    # 首頁導航
├── products.html                 # 主應用程式 (已更新支援 Supabase)
├── qrcode.html                   # QR 碼重導 (保留)
├── js/
│   ├── config.js                 # Supabase 組態
│   ├── auth.js                   # 認證模組
│   ├── products.js               # 產品管理模組
│   ├── ui.js                     # UI 工具函式
│   └── utils.js                  # 工具函式
├── css/
│   ├── styles.css                # 主樣式
│   └── admin.css                 # 管理介面樣式
├── .github/workflows/
│   └── jekyll-gh-pages.yml       # 自動部署
├── .nojekyll                     # 禁用 Jekyll
├── CLAUDE.md                     # AI 提示詞
├── README.md                     # 使用說明
└── spec.md                       # 本規格文件
```

### 6.2 UI 介面模式

**快速查詢模式 (保持不變)**
```
┌─────────────────────────────────┐
│     Orengione 快速查詢系統      │
├─────────────────────────────────┤
│ [QWERTY 鍵盤輸入]               │
│  Q W E R T Y U I O P            │
│  A S D F G H J K L              │
│  Z X C V B N M                  │
├─────────────────────────────────┤
│ 查詢結果:                       │
│ [ORG001] 產品名稱 NT$1,299      │
│ [ORG002] 另一產品 NT$1,599      │
└─────────────────────────────────┘
```

**認證模式 (新增)**
```
┌─────────────────────────────────┐
│     登入 Orengione 系統         │
├─────────────────────────────────┤
│ 電子郵件: [_________________]   │
│ 密碼:    [_________________]   │
│          [登 入]  [取消]        │
├─────────────────────────────────┤
│ 尚未有帳號? 請聯絡管理員        │
└─────────────────────────────────┘
```

**管理介面模式 (新增) - 僅管理員可見**
```
┌─────────────────────────────────┐
│     Orengione 管理介面          │
│     [已登入: admin@...]  [登出]  │
├─────────────────────────────────┤
│ 標籤: [快速查詢] [搜尋] [管理]  │
├─────────────────────────────────┤
│ 新增產品        刪除已選        │
│                                 │
│ 產品表格:                       │
│ ┌─┬─────┬──────────┬──────┐   │
│ │✓│編號 │ 名稱     │ 價格 │   │
│ ├─┼─────┼──────────┼──────┤   │
│ │✓│ORG1 │ 產品1    │1,299 │   │
│ │ │ORG2 │ 產品2    │1,599 │   │
│ └─┴─────┴──────────┴──────┘   │
└─────────────────────────────────┘
```

**進階搜尋模式 (保持不變)**
```
┌─────────────────────────────────┐
│     進階搜尋                    │
├─────────────────────────────────┤
│ 搜尋: [_________________]       │
│ 分類: [所有 ▼]                  │
│ 檢視: [列表] [網格]             │
├─────────────────────────────────┤
│ 結果: 12 項產品                 │
│ [ORG001] 產品1 NT$1,299 [編輯]  │
│ [ORG002] 產品2 NT$1,599 [編輯]  │
└─────────────────────────────────┘
```

### 6.3 JavaScript 模組

**config.js**
```javascript
// Supabase 連線組態
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGc...',
  
  // 功能開關
  ENABLE_ADMIN: true,
  ENABLE_AUDIT: true,
  
  // 效能設定
  CACHE_TIMEOUT: 5 * 60 * 1000,  // 5 分鐘
  PAGE_SIZE: 50,                 // 每頁 50 筆
};

// 初始化 Supabase
const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);
```

**auth.js**
```javascript
// 認證相關函式
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;
  
  localStorage.setItem('auth_token', data.session.access_token);
  localStorage.setItem('user_id', data.user.id);
  
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
}

async function getCurrentUser() {
  return await supabase.auth.getUser();
}
```

**products.js**
```javascript
// 產品管理相關函式
async function getProducts(category = 'all') {
  let query = supabase.from('products').select('*');
  
  if (category !== 'all') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.order('code');
  if (error) throw error;
  return data;
}

async function addProduct(formData) {
  // 需驗證是否為管理員
  const { data, error } = await supabase
    .from('products')
    .insert([formData])
    .select();
  
  if (error) throw error;
  return data[0];
}
```

---

## 7. 部署架構

### 7.1 GitHub Pages 部署流程

```mermaid
flowchart LR
    A["推送程式碼到 main"] -->|GitHub Actions| B["執行 jekyll-gh-pages.yml"]
    B -->|複製 HTML/CSS/JS| C["GitHub Pages 靜態內容"]
    C -->|使用者訪問| D["載入 products.html"]
    D -->|Supabase JS SDK| E["Supabase API"]
    E -->|JWT 認證| F["PostgreSQL"]
    F -->|RLS 政策| G["回傳授權資料"]
    G -->|JavaScript 更新 DOM| H["瀏覽器顯示結果"]
```

### 7.2 環境變數管理

**公開金鑰 (GitHub Pages 安全放置)**:
```javascript
// 可以在 HTML 中公開，RLS 會保護資料
const SUPABASE_ANON_KEY = 'eyJhbGc...';
const SUPABASE_URL = 'https://xxxxx.supabase.co';
```

**為何公開金鑰是安全的**:
1. JWT 驗證：每個請求必須包含有效的 JWT token
2. RLS 政策：即使有金鑰，資料庫也會檢查使用者權限
3. 行級安全：無認證的使用者只能讀取公開資料
4. 時間限制：token 有過期時間，無法無限期存取

---

## 8. 安全機制

### 8.1 六層防禦

| 層級 | 機制 | 防禦對象 |
|------|------|--------|
| **1. 網路層** | HTTPS 加密傳輸 | 中間人攻擊、竊聽 |
| **2. 認證層** | Supabase JWT | 未授權使用者 |
| **3. 授權層** | RLS 政策 | 越權存取 |
| **4. 資料層** | 觸發器日誌 | 審計追蹤 |
| **5. 應用層** | 輸入驗證 | SQL 注入、XSS |
| **6. 監控層** | 審計日誌 | 入侵偵測 |

### 8.2 RLS 安全政策

**政策 1: 所有人可讀取產品 (公開)**
```sql
CREATE POLICY "product_read" ON products
  FOR SELECT USING (true);
```

**政策 2: 只有管理員可修改**
```sql
CREATE POLICY "product_write" ON products
  FOR INSERT, UPDATE, DELETE
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin')
  );
```

**政策 3: 使用者只能修改自己的審計記錄**
```sql
CREATE POLICY "audit_self_view" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR
         EXISTS (SELECT 1 FROM user_roles
                 WHERE user_id = auth.uid() AND role = 'admin'));
```

### 8.3 安全考量

- ✅ **公開金鑰安全**: RLS 在資料庫層強制執行
- ✅ **token 管理**: localStorage 儲存，無 HTTP-only Cookie 支持 (GitHub Pages 限制)
- ✅ **輸入驗證**: 前端驗證 + Supabase 後端檢查
- ✅ **SQL 注入防護**: 使用參數化查詢 (Supabase SDK 預設)
- ✅ **XSS 防護**: 避免 innerHTML，使用 textContent
- ✅ **CORS**: Supabase 預設允許來自 GitHub Pages 的 CORS

---

## 9. 開發計畫 (5-6 週)

### 第 1 階段: 基礎設施 (第 1-2 週)

**目標**: Supabase 後端完全就緒

**工作項目**:
- [ ] 建立 Supabase 帳號與專案
- [ ] 建立 PostgreSQL 表 (products, user_roles, audit_logs)
- [ ] 設定所有 RLS 政策
- [ ] 建立審計觸發器
- [ ] 測試表結構與 RLS 權限
- [ ] 建立 2 個測試帳號 (admin + viewer)

**交付物**: Supabase 專案連線字串，測試帳號憑證

### 第 2 階段: 認證系統 (第 2-3 週)

**目標**: 使用者登入/登出完全功能

**工作項目**:
- [ ] 整合 Supabase Auth 到 products.html
- [ ] 建立登入 UI 表單
- [ ] 實現登入邏輯與 JWT token 儲存
- [ ] 實現登出邏輯與 token 清除
- [ ] 根據角色動態顯示/隱藏 UI 元素
- [ ] 測試登入流程與 token 過期處理

**交付物**: 可運作的登入/登出系統

### 第 3 階段: 產品管理 (第 3-4 週)

**目標**: 完整 CRUD 介面與 API 呼叫

**工作項目**:
- [ ] 從 Google Sheets 遷移產品資料到 Supabase
- [ ] 實現產品列表查詢 (GET)
- [ ] 實現新增產品表單 (POST)
- [ ] 實現編輯產品表單 (PATCH)
- [ ] 實現刪除產品確認 (DELETE)
- [ ] 整合分類篩選與排序
- [ ] 測試所有 CRUD 操作

**交付物**: 完整的產品管理介面

### 第 4 階段: 測試與最佳化 (第 4-5 週)

**目標**: 穩定、快速、安全的系統

**工作項目**:
- [ ] 執行單元測試 (JavaScript 函式)
- [ ] 執行整合測試 (API 呼叫)
- [ ] 執行安全測試 (RLS 政策、XSS、SQL 注入)
- [ ] 效能測試 (1000+ 產品查詢時間)
- [ ] 負載測試 (100+ 同時使用者)
- [ ] 修復發現的問題

**交付物**: 測試報告、效能指標

### 第 5 階段: 上線發布 (第 5-6 週)

**目標**: v2.0 正式上線運作

**工作項目**:
- [ ] 最終資料驗證 (Google Sheets vs Supabase)
- [ ] 內部測試 (admin 帳號測試)
- [ ] 撰寫使用者文件
- [ ] 撰寫管理員指南
- [ ] 產品上線 (GitHub Pages 發布)
- [ ] 監控系統運作

**交付物**: 正式上線系統、使用者文件

---

## 10. 測試計畫

### 10.1 單元測試

| 模組 | 測試項目 | 預期結果 |
|------|--------|--------|
| **auth.js** | login() 成功 | 返回 user 物件，token 儲存 |
| **auth.js** | login() 失敗 (錯誤密碼) | 拋出錯誤訊息 |
| **auth.js** | logout() 清除 token | localStorage 為空 |
| **products.js** | getProducts() 返回陣列 | 返回所有產品 |
| **products.js** | addProduct() 需管理員 | 非管理員拋出錯誤 |
| **products.js** | deleteProduct() 刪除成功 | 資料庫中產品消失 |

### 10.2 整合測試

| 場景 | 操作 | 預期結果 |
|------|------|--------|
| **訪客查詢** | 無登入訪問快速查詢 | 能看到所有產品 |
| **管理員新增** | 以 admin 帳號新增產品 | 產品出現在列表 |
| **檢視者限制** | 以 viewer 嘗試新增 | 顯示無權限錯誤 |
| **審計追蹤** | 新增產品後查詢日誌 | 日誌記錄完整變更 |

### 10.3 安全測試

| 攻擊類型 | 測試方法 | 預期結果 |
|--------|--------|--------|
| **RLS 越權** | 修改 JWT 宣稱為 admin | 資料庫拒絕未授權操作 |
| **SQL 注入** | 在搜尋框輸入 SQL 語句 | 安全轉義，無 SQL 執行 |
| **XSS 注入** | 在產品名稱插入 `<script>` | 顯示為純文字，無執行 |
| **Token 過期** | 等待 1 小時後操作 | 自動登出，要求重新登入 |

### 10.4 效能測試

| 場景 | 資料量 | 目標 | 測試方法 |
|------|------|------|--------|
| **快速查詢** | 1000 產品 | < 50ms | 瀏覽器計時器 |
| **產品列表** | 1000 產品 | < 100ms | API 回應時間 |
| **分類篩選** | 1000 產品 | < 50ms | 客戶端篩選速度 |
| **並發查詢** | 100 使用者 | 無錯誤 | 負載測試工具 |

---

## 11. 故障排除指南

### 11.1 常見問題

**Q: 登入後仍看不到管理介面?**
- A: 檢查使用者角色是否為 'admin' (查詢 user_roles 表)

**Q: RLS 政策導致查詢失敗?**
- A: 驗證使用者是否有 JWT token，檢查 RLS 政策邏輯

**Q: 產品新增後未立即出現?**
- A: 檢查是否有 UI 快取，手動重新整理頁面

**Q: 審計日誌為空?**
- A: 確認觸發器已建立，檢查資料庫日誌

### 11.2 調試步驟

1. **檢查瀏覽器主控台**: 是否有 JavaScript 錯誤
2. **查詢 Supabase 日誌**: 是否有 SQL 錯誤
3. **驗證 RLS 政策**: 使用 Supabase 管理介面測試
4. **測試 API 端點**: 使用 curl 或 Postman 直接呼叫
5. **檢查 JWT token**: 使用 jwt.io 解析 token 內容

---

## 12. 維護與擴展

### 12.1 日常維護

**每週**:
- 檢查 Supabase 免費方案使用量 (儲存空間、API 呼叫)
- 查看審計日誌是否有異常活動

**每月**:
- 備份 PostgreSQL 資料 (Supabase 自動備份)
- 審查使用者角色分配
- 清理過期的審計日誌記錄

### 12.2 備份策略

- Supabase 免費方案提供自動每日備份
- 可手動匯出 CSV 備份產品表
- 建議每月下載 CSV 備份到本地

### 12.3 未來擴展

**v2.1 計劃**:
- 新增進階報表功能 (銷售統計)
- 支援產品圖片上傳
- 實現產品標籤系統
- 新增客戶管理模組

**v3.0 計劃** (遠期):
- 遷移到自主託管後端 (成本考量)
- 行動應用版本
- 供應鏈管理整合

---

## 13. 參考資源

### 官方文件
- [Supabase 文件](https://supabase.com/docs)
- [PostgreSQL 官方文件](https://www.postgresql.org/docs/)
- [Supabase JS SDK](https://supabase.com/docs/reference/javascript)

### 相關工具
- [JWT 解析工具](https://jwt.io)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL GUI 工具](https://www.pgadmin.org/)

### 安全參考
- [OWASP Web 安全文件](https://owasp.org/www-project-web-security-testing-guide/)
- [Supabase RLS 指南](https://supabase.com/docs/guides/auth/row-level-security)

---

## 14. 附錄: 快速啟動檢查表

**部署前檢查清單**:

- [ ] Supabase 專案已建立
- [ ] 所有表與索引已建立
- [ ] RLS 政策已啟用
- [ ] 測試帳號已建立 (admin + viewer)
- [ ] products.html 已更新 Supabase 金鑰
- [ ] 產品資料已匯入
- [ ] 登入/登出功能已測試
- [ ] 管理介面已測試
- [ ] 快速查詢仍可正常運作
- [ ] 審計日誌記錄正常
- [ ] HTTPS 連線已驗證

**上線後監控**:

- [ ] 第 1 天: 觀察系統運作，檢查錯誤日誌
- [ ] 第 7 天: 性能分析，使用者反饋收集
- [ ] 第 30 天: 完整系統審查，優化建議

---

**文件版本歷史**

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2025-11-17 | 初始規格文件 |

**簽名**: 準備由開發團隊確認

---

*本文件為機密文件，請勿向外洩露。版權所有 © 2025 Orengione。*
