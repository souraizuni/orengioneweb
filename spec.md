# Orengione 進銷存管理系統 v3.0 規格文件

**版本**: 3.0  
**日期**: 2025年11月30日  
**作者**: Orengione 開發團隊  
**狀態**: 規劃中

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
5. **無進銷存功能**：無法追蹤庫存、進貨、銷售記錄

### 1.2 專案目標

遷移至 Supabase 後端，實現完整進銷存系統：

| 目標 | 詳細說明 |
|------|--------|
| **安全性** | 使用行級安全政策 (RLS) 保護敏感資料 |
| **認證系統** | 用戶登入/登出，三層角色管理 (管理員/店長/店員) |
| **產品管理** | 完整 CRUD 介面，含庫存數量、成本價、安全庫存 |
| **進貨管理** | 進貨單建立、供應商管理、自動增加庫存 |
| **銷售管理** | 銷售單建立、自動扣減庫存、銷售記錄追蹤 |
| **庫存管理** | 即時庫存查詢、安全庫存警示、庫存異動記錄 |
| **報表功能** | 銷售報表、庫存報表、CSV 匯出 |
| **效能** | 維持既有快速查詢功能，支援 5000+ 產品 |
| **成本** | 100% 使用 Supabase 免費方案，零成本運營 |
| **可維護性** | 清晰文件與架構，便於團隊開發與維護 |

### 1.3 系統規模與限制

| 項目 | 預估值 | Supabase 免費額度 | 狀態 |
|------|-------|------------------|------|
| **用戶數量** | 10 人 | 50,000 月活用戶 | ✅ 充裕 |
| **商品數量** | 5,000 筆 | 500 MB 資料庫 | ✅ 充裕 |
| **日交易量** | 100 筆 | 無限 API 請求 | ✅ 充裕 |
| **離線需求** | 無 | N/A | ✅ 無需 |
| **資料遷移** | 手動匯入 CSV | N/A | ✅ 可行 |

### 1.4 核心需求

**功能需求 (FR)**:
- FR-1: 管理員可管理產品 (新增/編輯/刪除)
- FR-2: 一般使用者可快速查詢產品
- FR-3: 所有操作記錄於審計日誌
- FR-4: 使用者認證與授權管理（三層角色）
- FR-5: 支援產品分類與篩選
- **FR-6: 進貨單管理（建立、查詢、自動入庫）**
- **FR-7: 銷售單管理（建立、查詢、自動出庫）**
- **FR-8: 庫存管理（即時庫存、安全庫存警示）**
- **FR-9: 庫存異動記錄（進貨/銷售/調整追蹤）**
- **FR-10: 報表功能（銷售統計、庫存報表、CSV 匯出）**
- **FR-11: 供應商管理（新增/編輯供應商資訊）**

**非功能需求 (NFR)**:
- NFR-1: 50ms 內完成查詢 (< 100ms 可接受)
- NFR-2: 支援同時 10 位用戶訪問
- NFR-3: 99% 可用性（每月停機時間 < 7 小時）
- NFR-4: RLS 強制所有資料存取權限
- **NFR-5: 資料完整性（庫存異動自動記錄）**
- **NFR-6: 報表產生時間 < 3 秒**

---

## 2. 技術架構

### 2.1 高層架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Pages (靜態網站)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    前端應用程式                             │  │
│  │  (HTML + CSS + JavaScript ES6+ + Supabase JS SDK)         │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │ 快速查詢模式 │  │ 進階搜尋模式 │  │ 認證模式    │        │  │
│  │  │ (QWERTY鍵盤)│  │             │  │ (登入/登出) │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │ 進貨管理模式 │  │ 銷售管理模式 │  │ 庫存管理模式 │        │  │
│  │  │ (店長+)     │  │ (店員+)     │  │ (店長+)     │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐                         │  │
│  │  │ 報表中心    │  │ 系統管理    │                         │  │
│  │  │ (店長+)     │  │ (管理員)    │                         │  │
│  │  └─────────────┘  └─────────────┘                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API 呼叫
                               │ (Supabase JS SDK)
                               │
        ┌──────────────────────▼──────────────────────┐
        │         Supabase 後端 (PostgreSQL)          │
        │  ┌────────────────────────────────────┐    │
        │  │  認證系統 (Supabase Auth + JWT)    │    │
        │  ├────────────────────────────────────┤    │
        │  │  資料庫表 (全部啟用 RLS 保護)       │    │
        │  │  ┌─────────────────────────────┐   │    │
        │  │  │ 核心表                       │   │    │
        │  │  │ ├─ products (商品+庫存)      │   │    │
        │  │  │ ├─ user_roles (用戶角色)     │   │    │
        │  │  │ └─ suppliers (供應商)        │   │    │
        │  │  └─────────────────────────────┘   │    │
        │  │  ┌─────────────────────────────┐   │    │
        │  │  │ 交易表                       │   │    │
        │  │  │ ├─ purchase_orders (進貨單)  │   │    │
        │  │  │ ├─ purchase_items (進貨明細) │   │    │
        │  │  │ ├─ sales_orders (銷售單)     │   │    │
        │  │  │ └─ sales_items (銷售明細)    │   │    │
        │  │  └─────────────────────────────┘   │    │
        │  │  ┌─────────────────────────────┐   │    │
        │  │  │ 記錄表                       │   │    │
        │  │  │ ├─ inventory_logs (庫存異動) │   │    │
        │  │  │ └─ audit_logs (審計日誌)     │   │    │
        │  │  └─────────────────────────────┘   │    │
        │  └────────────────────────────────────┘    │
        │                                             │
        │  ┌────────────────────────────────────┐    │
        │  │  觸發器 (Triggers)                  │    │
        │  │  ├─ 進貨完成 → 自動增加庫存        │    │
        │  │  ├─ 銷售完成 → 自動扣減庫存        │    │
        │  │  ├─ 庫存變動 → 自動記錄異動日誌    │    │
        │  │  └─ 資料變更 → 自動記錄審計日誌    │    │
        │  └────────────────────────────────────┘    │
        └─────────────────────────────────────────────┘
```

### 2.2 技術棧選型

| 面向 | Supabase | Firebase | MongoDB Atlas |
|------|----------|----------|---------------|
| **免費資料庫大小** | 500MB | 1GB (即時) | 512MB (M0) |
| **RLS 支持** | ✅ 原生 PostgreSQL | ⚠️ 自訂規則 | ❌ 手動認證 |
| **認證簡易性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **API 無限制** | ✅ 無限 | ⚠️ 讀寫計次 | ⚠️ 計次有限 |
| **關聯式查詢** | ✅ 原生 SQL | ❌ NoSQL | ⚠️ 聚合管道 |
| **觸發器支援** | ✅ PostgreSQL | ⚠️ Cloud Functions | ⚠️ Triggers |
| **交易支援** | ✅ ACID | ⚠️ 有限 | ✅ ACID |
| **推薦程度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**選擇 Supabase 的原因**:
1. 原生 PostgreSQL 支持複雜關聯查詢（進貨單→明細→商品）
2. RLS 在資料庫層強制執行權限（最安全）
3. 觸發器支援自動庫存計算（進貨/銷售時自動更新）
4. ACID 交易確保資料完整性（進貨/銷售原子操作）
5. 免費方案足夠（500MB >> ~50MB 預估資料量）
6. JWT 認證與 GitHub Pages 靜態網站兼容

### 2.3 角色權限設計

```
┌─────────────────────────────────────────────────────────────┐
│                      角色權限矩陣                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   管理員    │  │    店長     │  │    店員     │         │
│  │   (admin)   │  │  (manager)  │  │   (staff)   │         │
│  │  ─────────  │  │  ─────────  │  │  ─────────  │         │
│  │ • 所有權限  │  │ • 進貨管理  │  │ • 銷售記錄  │         │
│  │ • 用戶管理  │  │ • 庫存調整  │  │ • 商品查詢  │         │
│  │ • 系統設定  │  │ • 報表檢視  │  │ • 基本報表  │         │
│  │ • 報表匯出  │  │ • 銷售記錄  │  │             │         │
│  │ • 供應商管理│  │ • 商品查詢  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  權限繼承: admin > manager > staff > viewer (訪客)          │
└─────────────────────────────────────────────────────────────┘
```

| 功能模組 | 訪客 | 店員 (staff) | 店長 (manager) | 管理員 (admin) |
|---------|------|-------------|----------------|---------------|
| **商品查詢** | ✅ | ✅ | ✅ | ✅ |
| **銷售記錄** | ❌ | ✅ | ✅ | ✅ |
| **進貨管理** | ❌ | ❌ | ✅ | ✅ |
| **庫存調整** | ❌ | ❌ | ✅ | ✅ |
| **報表檢視** | ❌ | 📊基本 | ✅ | ✅ |
| **報表匯出** | ❌ | ❌ | ✅ | ✅ |
| **商品管理** | ❌ | ❌ | ✅ | ✅ |
| **供應商管理** | ❌ | ❌ | ❌ | ✅ |
| **用戶管理** | ❌ | ❌ | ❌ | ✅ |
| **系統設定** | ❌ | ❌ | ❌ | ✅ |

### 2.4 部署架構

```
GitHub Repository (main 分支)
    │
    ├─ HTML/CSS/JS 檔案
    │  ├─ index.html           # 首頁導航
    │  ├─ products.html        # 商品查詢 (主應用)
    │  ├─ inventory.html       # 進銷存管理 (新增)
    │  ├─ reports.html         # 報表中心 (新增)
    │  ├─ qrcode.html          # QR 碼重導
    │  ├─ css/
    │  │  ├─ styles.css        # 主樣式
    │  │  ├─ inventory.css     # 進銷存樣式
    │  │  └─ admin.css         # 管理介面樣式
    │  └─ js/
    │     ├─ config.js         # Supabase 組態
    │     ├─ auth.js           # 認證模組
    │     ├─ products.js       # 產品管理模組
    │     ├─ inventory.js      # 庫存管理模組 (新增)
    │     ├─ purchase.js       # 進貨管理模組 (新增)
    │     ├─ sales.js          # 銷售管理模組 (新增)
    │     ├─ reports.js        # 報表模組 (新增)
    │     ├─ ui.js             # UI 工具函式
    │     └─ utils.js          # 工具函式
    │
    ├─ 組態檔案
    │  ├─ .github/workflows/jekyll-gh-pages.yml
    │  └─ .nojekyll
    │
    └─ 文件
       ├─ README.md
       ├─ CLAUDE.md
       └─ spec.md (本文件)
           │
           ▼
    GitHub Pages 發布
    (https://souraizuni.github.io/orengioneweb/)
           │
           ▼
    Supabase API 呼叫 (JWT 認證)
           │
           ▼
    PostgreSQL 執行 (RLS 政策強制權限)
```

---

## 3. 資料模型與資料庫設計

### 3.1 資料表關聯圖 (ER Diagram)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   suppliers     │       │    products     │       │   user_roles    │
│   (供應商)      │       │    (商品)       │       │   (用戶角色)    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ code (UNIQUE)   │       │ user_id (FK)    │
│ contact         │       │ name            │       │ role            │
│ phone           │       │ selling_price   │       │ assigned_at     │
│ email           │       │ cost_price      │       │ assigned_by     │
│ address         │       │ stock_quantity  │       └────────┬────────┘
│ notes           │       │ min_stock       │                │
│ created_at      │       │ barcode         │                │
└────────┬────────┘       │ category        │                │
         │                │ description     │                │
         │                │ created_at      │                │
         │                │ updated_at      │                │
         │                │ created_by (FK) │────────────────┘
         │                │ updated_by (FK) │
         │                └────────┬────────┘
         │                         │
         │    ┌────────────────────┼────────────────────┐
         │    │                    │                    │
         ▼    ▼                    ▼                    ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ purchase_orders │       │  sales_orders   │       │ inventory_logs  │
│   (進貨單)      │       │   (銷售單)      │       │  (庫存異動)     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ order_number    │       │ order_number    │       │ product_id (FK) │
│ supplier_id(FK) │       │ customer_name   │       │ change_type     │
│ total_amount    │       │ total_amount    │       │ quantity_change │
│ status          │       │ discount        │       │ before_quantity │
│ notes           │       │ payment_method  │       │ after_quantity  │
│ created_by (FK) │       │ status          │       │ reference_type  │
│ created_at      │       │ created_by (FK) │       │ reference_id    │
└────────┬────────┘       │ created_at      │       │ notes           │
         │                └────────┬────────┘       │ created_by (FK) │
         │                         │                │ created_at      │
         ▼                         ▼                └─────────────────┘
┌─────────────────┐       ┌─────────────────┐
│ purchase_items  │       │  sales_items    │       ┌─────────────────┐
│  (進貨明細)     │       │  (銷售明細)     │       │   audit_logs    │
├─────────────────┤       ├─────────────────┤       │   (審計日誌)    │
│ id (PK)         │       │ id (PK)         │       ├─────────────────┤
│ order_id (FK)   │       │ order_id (FK)   │       │ id (PK)         │
│ product_id (FK) │       │ product_id (FK) │       │ user_id (FK)    │
│ quantity        │       │ quantity        │       │ action          │
│ unit_cost       │       │ unit_price      │       │ table_name      │
│ subtotal        │       │ subtotal        │       │ record_id       │
└─────────────────┘       └─────────────────┘       │ old_values      │
                                                    │ new_values      │
                                                    │ ip_address      │
                                                    │ created_at      │
                                                    └─────────────────┘
```

### 3.2 產品表 (products) - 擴充版

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,           -- 產品編號 (例: "O-A46B")
  name VARCHAR(255) NOT NULL,                 -- 產品名稱
  selling_price DECIMAL(10, 2) NOT NULL,      -- 售價 (NT$)
  cost_price DECIMAL(10, 2) DEFAULT 0,        -- 成本價 (NT$) [新增]
  stock_quantity INT DEFAULT 0,               -- 庫存數量 [新增]
  min_stock INT DEFAULT 5,                    -- 安全庫存警戒線 [新增]
  barcode VARCHAR(50),                        -- 國際條碼
  category VARCHAR(100),                      -- 商品分類
  description TEXT,                           -- 產品描述
  is_active BOOLEAN DEFAULT true,             -- 是否啟用 [新增]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 建立索引加快查詢
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock_quantity);  -- 庫存查詢索引
CREATE INDEX idx_products_low_stock ON products(stock_quantity, min_stock);  -- 低庫存警示索引
```

**RLS 政策**:
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 所有人可讀取產品 (公開查詢)
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (true);

-- 店長與管理員可新增產品
CREATE POLICY "products_insert_manager"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- 店長與管理員可編輯產品
CREATE POLICY "products_update_manager"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- 只有管理員可刪除產品
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3.3 供應商表 (suppliers) [新增]

```sql
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                 -- 供應商名稱
  contact VARCHAR(100),                       -- 聯絡人
  phone VARCHAR(20),                          -- 電話
  email VARCHAR(100),                         -- 電子郵件
  address TEXT,                               -- 地址
  notes TEXT,                                 -- 備註
  is_active BOOLEAN DEFAULT true,             -- 是否啟用
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
```

**RLS 政策**:
```sql
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 店長以上可讀取供應商
CREATE POLICY "suppliers_select_manager"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- 只有管理員可管理供應商
CREATE POLICY "suppliers_all_admin"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3.4 進貨單表 (purchase_orders) [新增]

```sql
CREATE TABLE purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,   -- 進貨單號 (例: "PO-20251130-001")
  supplier_id BIGINT REFERENCES suppliers(id),-- 供應商
  total_amount DECIMAL(12, 2) DEFAULT 0,      -- 總金額
  status VARCHAR(20) DEFAULT 'pending',       -- pending/completed/cancelled
  notes TEXT,                                 -- 備註
  completed_at TIMESTAMP,                     -- 完成時間
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created ON purchase_orders(created_at);
```

### 3.5 進貨明細表 (purchase_items) [新增]

```sql
CREATE TABLE purchase_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0), -- 數量
  unit_cost DECIMAL(10, 2) NOT NULL,          -- 單位成本
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

CREATE INDEX idx_purchase_items_order ON purchase_items(order_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);
```

**RLS 政策 (進貨單與明細)**:
```sql
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- 店長以上可管理進貨單
CREATE POLICY "purchase_orders_manager"
  ON purchase_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "purchase_items_manager"
  ON purchase_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
```

### 3.6 銷售單表 (sales_orders) [新增]

```sql
CREATE TABLE sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,   -- 銷售單號 (例: "SO-20251130-001")
  customer_name VARCHAR(100),                 -- 顧客姓名 (選填)
  total_amount DECIMAL(12, 2) DEFAULT 0,      -- 總金額
  discount DECIMAL(10, 2) DEFAULT 0,          -- 折扣金額
  final_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - discount) STORED,
  payment_method VARCHAR(20) DEFAULT 'cash',  -- cash/card/transfer/other
  status VARCHAR(20) DEFAULT 'completed',     -- completed/cancelled/refunded
  notes TEXT,                                 -- 備註
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_created ON sales_orders(created_at);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
```

### 3.7 銷售明細表 (sales_items) [新增]

```sql
CREATE TABLE sales_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0), -- 數量
  unit_price DECIMAL(10, 2) NOT NULL,         -- 單價
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX idx_sales_items_order ON sales_items(order_id);
CREATE INDEX idx_sales_items_product ON sales_items(product_id);
```

**RLS 政策 (銷售單與明細)**:
```sql
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- 店員以上可建立銷售單
CREATE POLICY "sales_orders_staff"
  ON sales_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'staff')
    )
  );

CREATE POLICY "sales_items_staff"
  ON sales_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'staff')
    )
  );
```

### 3.8 庫存異動記錄表 (inventory_logs) [新增]

```sql
CREATE TABLE inventory_logs (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  change_type VARCHAR(20) NOT NULL,           -- purchase/sale/adjustment/return/initial
  quantity_change INT NOT NULL,               -- 異動數量 (正數=增加, 負數=減少)
  before_quantity INT NOT NULL,               -- 異動前數量
  after_quantity INT NOT NULL,                -- 異動後數量
  reference_type VARCHAR(20),                 -- 關聯類型: purchase_order/sales_order/manual
  reference_id BIGINT,                        -- 關聯單號 ID
  notes TEXT,                                 -- 備註
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_type ON inventory_logs(change_type);
CREATE INDEX idx_inventory_logs_created ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_reference ON inventory_logs(reference_type, reference_id);
```

**RLS 政策**:
```sql
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 店長以上可讀取庫存異動記錄
CREATE POLICY "inventory_logs_select_manager"
  ON inventory_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- 系統自動寫入 (透過觸發器)
CREATE POLICY "inventory_logs_insert_system"
  ON inventory_logs FOR INSERT
  WITH CHECK (true);  -- 由觸發器控制
```

### 3.9 使用者角色表 (user_roles) - 擴充版

```sql
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),  -- 三層角色
  display_name VARCHAR(100),                  -- 顯示名稱 [新增]
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**RLS 政策**:
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 使用者可檢視自己的角色
CREATE POLICY "user_roles_select_self"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 管理員可檢視所有角色
CREATE POLICY "user_roles_select_admin"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 只有管理員可分配角色
CREATE POLICY "user_roles_manage_admin"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3.10 審計日誌表 (audit_logs)

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

### 3.11 自動觸發器 - 庫存管理 [新增]

**進貨完成自動增加庫存**:
```sql
CREATE OR REPLACE FUNCTION process_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- 當進貨單狀態從 pending 變為 completed
  IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
    -- 更新每個商品的庫存
    UPDATE products p
    SET stock_quantity = p.stock_quantity + pi.quantity,
        cost_price = pi.unit_cost,  -- 更新成本價為最新進貨價
        updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.order_id = NEW.id AND pi.product_id = p.id;
    
    -- 記錄庫存異動
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, 
                                before_quantity, after_quantity, 
                                reference_type, reference_id, created_by)
    SELECT 
      pi.product_id,
      'purchase',
      pi.quantity,
      p.stock_quantity - pi.quantity,
      p.stock_quantity,
      'purchase_order',
      NEW.id,
      NEW.created_by
    FROM purchase_items pi
    JOIN products p ON p.id = pi.product_id
    WHERE pi.order_id = NEW.id;
    
    -- 更新完成時間
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER purchase_completion_trigger
BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION process_purchase_completion();
```

**銷售完成自動扣減庫存**:
```sql
CREATE OR REPLACE FUNCTION process_sale_completion()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_stock INT;
BEGIN
  -- 新建銷售單時自動扣減庫存
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    FOR item IN SELECT * FROM sales_items WHERE order_id = NEW.id
    LOOP
      -- 檢查庫存是否足夠
      SELECT stock_quantity INTO current_stock FROM products WHERE id = item.product_id;
      
      IF current_stock < item.quantity THEN
        RAISE EXCEPTION '商品庫存不足: product_id=%, 現有庫存=%, 需求數量=%', 
                        item.product_id, current_stock, item.quantity;
      END IF;
      
      -- 扣減庫存
      UPDATE products
      SET stock_quantity = stock_quantity - item.quantity,
          updated_at = NOW()
      WHERE id = item.product_id;
      
      -- 記錄庫存異動
      INSERT INTO inventory_logs (product_id, change_type, quantity_change,
                                  before_quantity, after_quantity,
                                  reference_type, reference_id, created_by)
      VALUES (
        item.product_id,
        'sale',
        -item.quantity,
        current_stock,
        current_stock - item.quantity,
        'sales_order',
        NEW.id,
        NEW.created_by
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sale_completion_trigger
AFTER INSERT ON sales_orders
FOR EACH ROW EXECUTE FUNCTION process_sale_completion();
```

**自動計算訂單總金額**:
```sql
-- 進貨單總金額
CREATE OR REPLACE FUNCTION update_purchase_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM purchase_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER purchase_items_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_purchase_total();

-- 銷售單總金額
CREATE OR REPLACE FUNCTION update_sales_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sales_orders
  SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM sales_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sales_items_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales_items
FOR EACH ROW EXECUTE FUNCTION update_sales_total();
```

---

## 4. 功能需求詳細規格

### FR-1: 管理員產品管理

**使用案例**: 店長/管理員登入後，可新增/編輯/刪除產品

**新增產品** (含庫存欄位):
```javascript
async function addProduct(formData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('未登入');
  
  const role = await getUserRole(user.id);
  if (!['admin', 'manager'].includes(role)) throw new Error('無權限');
  
  const { data, error } = await supabase
    .from('products')
    .insert([{
      code: formData.code.toUpperCase(),
      name: formData.name,
      selling_price: parseFloat(formData.sellingPrice),
      cost_price: parseFloat(formData.costPrice) || 0,
      stock_quantity: parseInt(formData.stockQuantity) || 0,
      min_stock: parseInt(formData.minStock) || 5,
      barcode: formData.barcode || null,
      category: formData.category,
      description: formData.description || null,
      created_by: user.id
    }])
    .select();
  
  if (error) throw new Error(`新增失敗: ${error.message}`);
  return data[0];
}
```

### FR-2: 一般使用者快速查詢

**使用案例**: 訪客可快速查詢產品，無需登入（維持現有功能）

### FR-3: 審計日誌

**自動記錄所有變更** (維持現有功能)

### FR-4: 認證與授權（三層角色）

**登入流程**:
```javascript
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw new Error(`登入失敗: ${error.message}`);
  
  // 取得使用者角色
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, display_name')
    .eq('user_id', data.user.id)
    .single();
  
  const userInfo = {
    id: data.user.id,
    email: data.user.email,
    role: roleData?.role || 'staff',
    displayName: roleData?.display_name || data.user.email
  };
  
  localStorage.setItem('user_info', JSON.stringify(userInfo));
  return userInfo;
}

// 權限檢查工具函式
function hasPermission(requiredRole) {
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const roleHierarchy = { admin: 3, manager: 2, staff: 1 };
  return (roleHierarchy[userInfo.role] || 0) >= (roleHierarchy[requiredRole] || 0);
}
```

### FR-5: 分類與篩選 (維持現有功能)

### FR-6: 進貨單管理 [新增]

**使用案例**: 店長建立進貨單，完成後自動增加庫存

**建立進貨單**:
```javascript
async function createPurchaseOrder(supplierOrName, items, notes = '') {
  const user = await getCurrentUser();
  if (!hasPermission('manager')) throw new Error('無權限');
  
  // 產生進貨單號: PO-YYYYMMDD-XXX
  const orderNumber = await generateOrderNumber('PO');
  
  // 建立進貨單
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert([{
      order_number: orderNumber,
      supplier_id: typeof supplierOrName === 'number' ? supplierOrName : null,
      notes: typeof supplierOrName === 'string' ? `供應商: ${supplierOrName}\n${notes}` : notes,
      status: 'pending',
      created_by: user.id
    }])
    .select()
    .single();
  
  if (orderError) throw new Error(`建立進貨單失敗: ${orderError.message}`);
  
  // 建立進貨明細
  const itemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_cost: item.unitCost
  }));
  
  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(itemsData);
  
  if (itemsError) throw new Error(`建立進貨明細失敗: ${itemsError.message}`);
  
  return order;
}

// 完成進貨單 (觸發庫存增加)
async function completePurchaseOrder(orderId) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'completed' })
    .eq('id', orderId)
    .select();
  
  if (error) throw new Error(`完成進貨單失敗: ${error.message}`);
  return data[0];
}
```

### FR-7: 銷售單管理 [新增]

**使用案例**: 店員建立銷售單，自動扣減庫存

**建立銷售單**:
```javascript
async function createSalesOrder(items, customerName = '', discount = 0, paymentMethod = 'cash', notes = '') {
  const user = await getCurrentUser();
  if (!hasPermission('staff')) throw new Error('無權限');
  
  // 先檢查庫存是否足夠
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, name')
      .eq('id', item.productId)
      .single();
    
    if (product.stock_quantity < item.quantity) {
      throw new Error(`商品 "${product.name}" 庫存不足 (現有: ${product.stock_quantity}, 需求: ${item.quantity})`);
    }
  }
  
  // 產生銷售單號: SO-YYYYMMDD-XXX
  const orderNumber = await generateOrderNumber('SO');
  
  // 建立銷售單
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert([{
      order_number: orderNumber,
      customer_name: customerName,
      discount: discount,
      payment_method: paymentMethod,
      notes: notes,
      status: 'completed',
      created_by: user.id
    }])
    .select()
    .single();
  
  if (orderError) throw new Error(`建立銷售單失敗: ${orderError.message}`);
  
  // 建立銷售明細
  const itemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice
  }));
  
  const { error: itemsError } = await supabase
    .from('sales_items')
    .insert(itemsData);
  
  if (itemsError) throw new Error(`建立銷售明細失敗: ${itemsError.message}`);
  
  return order;
}
```

### FR-8: 庫存管理 [新增]

**使用案例**: 店長檢視即時庫存、低庫存警示、手動調整庫存

**即時庫存查詢**:
```javascript
async function getInventoryStatus(options = {}) {
  let query = supabase
    .from('products')
    .select('id, code, name, category, stock_quantity, min_stock, selling_price, cost_price')
    .eq('is_active', true)
    .order('code');
  
  // 只顯示低庫存商品
  if (options.lowStockOnly) {
    query = query.lte('stock_quantity', supabase.raw('min_stock'));
  }
  
  // 分類篩選
  if (options.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data.map(p => ({
    ...p,
    isLowStock: p.stock_quantity <= p.min_stock,
    stockValue: p.stock_quantity * p.cost_price
  }));
}

// 低庫存警示
async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, code, name, category, stock_quantity, min_stock')
    .eq('is_active', true)
    .lte('stock_quantity', supabase.raw('min_stock'))
    .order('stock_quantity');
  
  if (error) throw error;
  return data;
}
```

**手動調整庫存**:
```javascript
async function adjustStock(productId, adjustment, reason) {
  const user = await getCurrentUser();
  if (!hasPermission('manager')) throw new Error('無權限');
  
  // 取得目前庫存
  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();
  
  const beforeQty = product.stock_quantity;
  const afterQty = beforeQty + adjustment;
  
  if (afterQty < 0) throw new Error('調整後庫存不能為負數');
  
  // 更新庫存
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      stock_quantity: afterQty,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('id', productId);
  
  if (updateError) throw updateError;
  
  // 記錄庫存異動
  const { error: logError } = await supabase
    .from('inventory_logs')
    .insert([{
      product_id: productId,
      change_type: 'adjustment',
      quantity_change: adjustment,
      before_quantity: beforeQty,
      after_quantity: afterQty,
      reference_type: 'manual',
      notes: reason,
      created_by: user.id
    }]);
  
  if (logError) throw logError;
  
  return { beforeQty, afterQty };
}
```

### FR-9: 庫存異動記錄 [新增]

**使用案例**: 店長檢視商品的庫存異動歷史

```javascript
async function getInventoryLogs(options = {}) {
  let query = supabase
    .from('inventory_logs')
    .select(`
      *,
      products (code, name),
      user:created_by (email)
    `)
    .order('created_at', { ascending: false });
  
  if (options.productId) {
    query = query.eq('product_id', options.productId);
  }
  
  if (options.changeType) {
    query = query.eq('change_type', options.changeType);
  }
  
  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  
  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### FR-10: 報表功能 [新增]

**使用案例**: 店長檢視銷售報表、庫存報表，並匯出 CSV

**銷售報表**:
```javascript
async function getSalesReport(startDate, endDate) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      id, order_number, customer_name, total_amount, discount, final_amount,
      payment_method, created_at,
      sales_items (
        quantity, unit_price, subtotal,
        products (code, name, category)
      )
    `)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // 計算統計
  const summary = {
    totalOrders: data.length,
    totalRevenue: data.reduce((sum, o) => sum + parseFloat(o.final_amount), 0),
    totalDiscount: data.reduce((sum, o) => sum + parseFloat(o.discount), 0),
    byPaymentMethod: {},
    byCategory: {},
    topProducts: {}
  };
  
  data.forEach(order => {
    // 付款方式統計
    summary.byPaymentMethod[order.payment_method] = 
      (summary.byPaymentMethod[order.payment_method] || 0) + parseFloat(order.final_amount);
    
    // 分類與商品統計
    order.sales_items.forEach(item => {
      const cat = item.products.category || '未分類';
      summary.byCategory[cat] = (summary.byCategory[cat] || 0) + parseFloat(item.subtotal);
      
      const code = item.products.code;
      if (!summary.topProducts[code]) {
        summary.topProducts[code] = { name: item.products.name, quantity: 0, revenue: 0 };
      }
      summary.topProducts[code].quantity += item.quantity;
      summary.topProducts[code].revenue += parseFloat(item.subtotal);
    });
  });
  
  return { orders: data, summary };
}

// 庫存報表
async function getInventoryReport() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category, code');
  
  if (error) throw error;
  
  const summary = {
    totalProducts: data.length,
    totalStockValue: data.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0),
    lowStockCount: data.filter(p => p.stock_quantity <= p.min_stock).length,
    outOfStockCount: data.filter(p => p.stock_quantity === 0).length,
    byCategory: {}
  };
  
  data.forEach(p => {
    const cat = p.category || '未分類';
    if (!summary.byCategory[cat]) {
      summary.byCategory[cat] = { count: 0, stockValue: 0 };
    }
    summary.byCategory[cat].count++;
    summary.byCategory[cat].stockValue += p.stock_quantity * p.cost_price;
  });
  
  return { products: data, summary };
}

// CSV 匯出
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
```

### FR-11: 供應商管理 [新增]

**使用案例**: 管理員管理供應商資訊

```javascript
async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data;
}

async function addSupplier(formData) {
  const user = await getCurrentUser();
  if (!hasPermission('admin')) throw new Error('無權限');
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{
      name: formData.name,
      contact: formData.contact,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      notes: formData.notes,
      created_by: user.id
    }])
    .select();
  
  if (error) throw error;
  return data[0];
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
    "email": "admin@example.com"
  }
}
```

### 5.2 產品端點

**列表所有產品** (GET)
```
GET /rest/v1/products?select=*&is_active=eq.true&order=code.asc

回應: [{ id, code, name, selling_price, cost_price, stock_quantity, min_stock, ... }]
```

**建立產品** (POST) - 需 admin/manager
```
POST /rest/v1/products
Authorization: Bearer {token}
Content-Type: application/json

{ "code": "ORG002", "name": "新產品", "selling_price": 1599.99, "cost_price": 800, ... }
```

### 5.3 進貨單端點 [新增]

**列表進貨單** (GET) - 需 manager+
```
GET /rest/v1/purchase_orders?select=*,purchase_items(*,products(*)),suppliers(*)&order=created_at.desc
```

**建立進貨單** (POST) - 需 manager+
```
POST /rest/v1/purchase_orders
Authorization: Bearer {token}

{ "order_number": "PO-20251201-001", "supplier_id": 1, "notes": "..." }
```

**建立進貨明細** (POST)
```
POST /rest/v1/purchase_items

[
  { "order_id": 1, "product_id": 1, "quantity": 10, "unit_cost": 500 },
  { "order_id": 1, "product_id": 2, "quantity": 5, "unit_cost": 800 }
]
```

**完成進貨單** (PATCH) - 觸發庫存增加
```
PATCH /rest/v1/purchase_orders?id=eq.1

{ "status": "completed" }
```

### 5.4 銷售單端點 [新增]

**列表銷售單** (GET) - 需 staff+
```
GET /rest/v1/sales_orders?select=*,sales_items(*,products(*))&order=created_at.desc
```

**建立銷售單** (POST) - 需 staff+ (自動扣庫存)
```
POST /rest/v1/sales_orders
Authorization: Bearer {token}

{
  "order_number": "SO-20251201-001",
  "customer_name": "王先生",
  "discount": 100,
  "payment_method": "cash",
  "status": "completed"
}
```

**建立銷售明細** (POST)
```
POST /rest/v1/sales_items

[
  { "order_id": 1, "product_id": 1, "quantity": 2, "unit_price": 1299 },
  { "order_id": 1, "product_id": 3, "quantity": 1, "unit_price": 599 }
]
```

### 5.5 庫存端點 [新增]

**查詢低庫存商品** (GET)
```
GET /rest/v1/products?select=id,code,name,stock_quantity,min_stock
  &is_active=eq.true&stock_quantity=lte.min_stock
```

**手動調整庫存** (PATCH) - 需 manager+
```
PATCH /rest/v1/products?id=eq.1

{ "stock_quantity": 50 }
```

**查詢庫存異動記錄** (GET)
```
GET /rest/v1/inventory_logs?select=*,products(code,name)
  &product_id=eq.1&order=created_at.desc
```

### 5.6 供應商端點 [新增]

**列表供應商** (GET) - 需 manager+
```
GET /rest/v1/suppliers?select=*&is_active=eq.true&order=name
```

**建立供應商** (POST) - 需 admin
```
POST /rest/v1/suppliers

{ "name": "供應商A", "contact": "張先生", "phone": "02-12345678", ... }
```

### 5.7 報表端點 [新增]

**銷售報表** (GET) - 需 manager+
```
GET /rest/v1/sales_orders?select=
  order_number,total_amount,discount,final_amount,payment_method,created_at,
  sales_items(quantity,unit_price,subtotal,products(code,name,category))
  &status=eq.completed
  &created_at=gte.2025-12-01
  &created_at=lte.2025-12-31
```

### 5.8 審計端點

**查詢審計日誌** (GET) - 需 admin
```
GET /rest/v1/audit_logs?select=*&order=created_at.desc&limit=100
```

---

## 6. 前端架構

### 6.1 檔案結構 (v3.0 更新)

```
orengioneweb/
├── index.html                    # 首頁導航
├── products.html                 # 快速查詢 + 產品管理
├── inventory.html                # [新增] 庫存管理介面
├── purchase.html                 # [新增] 進貨管理介面
├── sales.html                    # [新增] 銷售管理介面
├── reports.html                  # [新增] 報表中心
├── admin.html                    # [新增] 系統管理 (使用者/供應商)
├── qrcode.html                   # QR 碼重導 (保留)
├── login.html                    # [新增] 登入頁面
├── js/
│   ├── config.js                 # Supabase 組態
│   ├── supabase-client.js        # Supabase SDK 封裝
│   ├── auth.js                   # 認證模組
│   ├── products.js               # 產品管理模組
│   ├── inventory.js              # [新增] 庫存管理模組
│   ├── purchase.js               # [新增] 進貨管理模組
│   ├── sales.js                  # [新增] 銷售管理模組
│   ├── reports.js                # [新增] 報表模組
│   ├── suppliers.js              # [新增] 供應商模組
│   ├── ui.js                     # UI 工具函式
│   └── utils.js                  # 工具函式 (含單號產生)
├── css/
│   ├── styles.css                # 主樣式
│   ├── admin.css                 # 管理介面樣式
│   └── print.css                 # [新增] 列印樣式
├── .github/workflows/
│   └── jekyll-gh-pages.yml       # 自動部署
├── .nojekyll                     # 禁用 Jekyll
├── CLAUDE.md                     # AI 提示詞
├── README.md                     # 使用說明
└── spec.md                       # 本規格文件
```

### 6.2 頁面權限矩陣

| 頁面 | 訪客 | staff | manager | admin |
|------|------|-------|---------|-------|
| products.html (查詢) | ✅ | ✅ | ✅ | ✅ |
| products.html (管理) | ❌ | ❌ | ✅ | ✅ |
| inventory.html | ❌ | 唯讀 | ✅ | ✅ |
| purchase.html | ❌ | ❌ | ✅ | ✅ |
| sales.html | ❌ | ✅ | ✅ | ✅ |
| reports.html | ❌ | ❌ | ✅ | ✅ |
| admin.html | ❌ | ❌ | ❌ | ✅ |

### 6.3 UI 介面模式

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

**導航列 (登入後)**
```
┌─────────────────────────────────────────────────────────────┐
│ Orengione  [快速查詢] [庫存] [進貨] [銷售] [報表] [管理]    │
│                                        [王店長 ▼] [登出]   │
└─────────────────────────────────────────────────────────────┘
```

**庫存管理介面 (inventory.html)** [新增]
```
┌─────────────────────────────────────────────────────────────┐
│ 庫存管理                                    [匯出CSV] [列印]│
├─────────────────────────────────────────────────────────────┤
│ 篩選: [全部 ▼] [低庫存 ▢] 搜尋: [____________]             │
├─────────────────────────────────────────────────────────────┤
│ 統計: 總商品 150 | 總價值 NT$500,000 | ⚠️ 低庫存 8 | 缺貨 2 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┬────────────┬──────┬─────┬──────┬────────┐         │
│ │編號 │ 名稱       │ 分類 │ 庫存│ 最低 │ 操作   │         │
│ ├─────┼────────────┼──────┼─────┼──────┼────────┤         │
│ │ORG1 │ 產品1      │ 分類A│ ⚠️3 │  5   │[調整]  │         │
│ │ORG2 │ 產品2      │ 分類B│  50 │  10  │[調整]  │         │
│ │ORG3 │ 產品3      │ 分類A│ 🔴0 │  5   │[調整]  │         │
│ └─────┴────────────┴──────┴─────┴──────┴────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**進貨單介面 (purchase.html)** [新增]
```
┌─────────────────────────────────────────────────────────────┐
│ 進貨管理                                    [+ 新增進貨單] │
├─────────────────────────────────────────────────────────────┤
│ 進貨單列表:                                                 │
│ ┌──────────────────┬──────────┬────────┬───────┬────────┐ │
│ │ 單號             │ 供應商   │ 金額   │ 狀態  │ 操作   │ │
│ ├──────────────────┼──────────┼────────┼───────┼────────┤ │
│ │ PO-20251201-001  │ 供應商A  │ 15,000 │ 待入庫│[完成]  │ │
│ │ PO-20251130-002  │ 供應商B  │ 28,500 │ 已完成│[檢視]  │ │
│ └──────────────────┴──────────┴────────┴───────┴────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 新增進貨單:                                                 │
│ 供應商: [供應商A ▼]  備註: [______________]                │
│ ┌─────┬────────────┬──────┬────────┬────────┐             │
│ │編號 │ 名稱       │ 數量 │ 成本   │ 小計   │             │
│ ├─────┼────────────┼──────┼────────┼────────┤             │
│ │ORG1 │ 產品1      │ [10] │ [500]  │ 5,000  │ [X]        │
│ │     │ [+ 新增商品]                         │             │
│ └─────┴────────────┴──────┴────────┴────────┘             │
│                             總計: NT$5,000   [儲存進貨單]  │
└─────────────────────────────────────────────────────────────┘
```

**銷售單介面 (sales.html)** [新增]
```
┌─────────────────────────────────────────────────────────────┐
│ 銷售管理                              [+ 新增銷售] [歷史]  │
├─────────────────────────────────────────────────────────────┤
│ 新增銷售單:                                                 │
│ ┌─────┬────────────┬──────┬────────┬────────┬─────┐       │
│ │編號 │ 名稱       │ 庫存 │ 數量   │ 單價   │小計 │       │
│ ├─────┼────────────┼──────┼────────┼────────┼─────┤       │
│ │ORG1 │ 產品1      │  50  │  [2]   │ 1,299  │2,598│ [X]  │
│ │ORG2 │ 產品2      │  30  │  [1]   │ 1,599  │1,599│ [X]  │
│ └─────┴────────────┴──────┴────────┴────────┴─────┘       │
│ [掃描條碼] [搜尋商品]                                       │
├─────────────────────────────────────────────────────────────┤
│ 客戶: [__________]  折扣: [__100_]  付款: [現金 ▼]         │
│                     小計: NT$4,197                          │
│                     折扣: -NT$100                           │
│                     ─────────────                           │
│                     應付: NT$4,097       [完成結帳]        │
└─────────────────────────────────────────────────────────────┘
```

**報表介面 (reports.html)** [新增]
```
┌─────────────────────────────────────────────────────────────┐
│ 報表中心                                                    │
├─────────────────────────────────────────────────────────────┤
│ 期間: [2025-12-01] ~ [2025-12-31]  [產生報表]               │
├──────────────────────────┬──────────────────────────────────┤
│ 銷售摘要                 │ 分類銷售                         │
│ ───────────             │ ───────────                      │
│ 訂單數: 156              │ ┌────────────────────┐          │
│ 總營收: NT$203,500       │ │  [圓餅圖]          │          │
│ 總折扣: -NT$5,200        │ │  分類A: 45%        │          │
│ 淨營收: NT$198,300       │ │  分類B: 35%        │          │
│                          │ │  分類C: 20%        │          │
│ 付款方式:                │ └────────────────────┘          │
│ • 現金: NT$120,000       │                                  │
│ • 刷卡: NT$78,300        │ [匯出銷售明細CSV]                │
├──────────────────────────┴──────────────────────────────────┤
│ 熱銷商品 TOP 10                                             │
│ 1. ORG001 產品1 - 銷售 120 件, 營收 NT$155,880              │
│ 2. ORG015 產品15 - 銷售 85 件, 營收 NT$42,500               │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 JavaScript 模組

**config.js**
```javascript
// Supabase 連線組態
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGc...',
  
  // 功能開關
  ENABLE_ADMIN: true,
  ENABLE_AUDIT: true,
  ENABLE_INVENTORY: true,
  
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

**utils.js - 單號產生器** [新增]
```javascript
// 產生訂單編號: XX-YYYYMMDD-XXX
async function generateOrderNumber(prefix) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const pattern = `${prefix}-${today}-%`;
  
  // 查詢今日最後一筆單號
  const tableName = prefix === 'PO' ? 'purchase_orders' : 'sales_orders';
  const { data } = await supabase
    .from(tableName)
    .select('order_number')
    .like('order_number', pattern)
    .order('order_number', { ascending: false })
    .limit(1);
  
  let sequence = 1;
  if (data && data.length > 0) {
    const lastSeq = parseInt(data[0].order_number.split('-')[2]);
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${today}-${String(sequence).padStart(3, '0')}`;
}
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

## 9. 開發計畫 (8-10 週)

### 第 1 階段: 基礎設施 (第 1-2 週)

**目標**: Supabase 後端完全就緒

**工作項目**:
- [ ] 建立 Supabase 帳號與專案
- [ ] 建立所有 PostgreSQL 表 (共 9 張)
- [ ] 設定所有 RLS 政策 (三層角色)
- [ ] 建立自動觸發器 (庫存/金額計算)
- [ ] 測試表結構與 RLS 權限
- [ ] 建立測試帳號 (admin + manager + staff)

**交付物**: Supabase 專案連線字串，測試帳號憑證

### 第 2 階段: 認證與權限系統 (第 2-3 週)

**目標**: 三層角色認證完全功能

**工作項目**:
- [ ] 整合 Supabase Auth
- [ ] 建立登入頁面 (login.html)
- [ ] 實現 JWT token 管理
- [ ] 實現角色權限檢查 (hasPermission)
- [ ] 建立導航列與角色顯示
- [ ] 根據角色動態顯示/隱藏功能

**交付物**: 可運作的認證系統

### 第 3 階段: 產品與庫存管理 (第 3-4 週)

**目標**: 產品 CRUD + 庫存管理

**工作項目**:
- [ ] 從 Google Sheets 遷移產品資料
- [ ] 更新 products.html (新增庫存欄位)
- [ ] 建立 inventory.html 庫存管理介面
- [ ] 實現低庫存警示功能
- [ ] 實現手動調整庫存功能
- [ ] 實現庫存異動記錄查詢

**交付物**: 完整的產品/庫存管理介面

### 第 4 階段: 進貨管理 (第 4-5 週)

**目標**: 完整進貨流程

**工作項目**:
- [ ] 建立 purchase.html 介面
- [ ] 實現供應商管理 (CRUD)
- [ ] 實現進貨單建立功能
- [ ] 實現進貨單完成 (自動入庫)
- [ ] 測試庫存自動增加觸發器

**交付物**: 完整的進貨管理系統

### 第 5 階段: 銷售管理 (第 5-6 週)

**目標**: 完整銷售流程

**工作項目**:
- [ ] 建立 sales.html 介面
- [ ] 實現商品搜尋與加入購物車
- [ ] 實現銷售單結帳功能
- [ ] 實現折扣與付款方式處理
- [ ] 測試庫存自動扣減觸發器
- [ ] 實現銷售歷史查詢

**交付物**: 完整的銷售管理系統

### 第 6 階段: 報表中心 (第 6-7 週)

**目標**: 完整報表功能

**工作項目**:
- [ ] 建立 reports.html 介面
- [ ] 實現銷售報表 (期間查詢)
- [ ] 實現庫存報表 (即時價值)
- [ ] 實現分類銷售統計
- [ ] 實現熱銷商品排行
- [ ] 實現 CSV 匯出功能

**交付物**: 完整的報表中心

### 第 7 階段: 測試與最佳化 (第 7-8 週)

**目標**: 穩定、快速、安全的系統

**工作項目**:
- [ ] 執行單元測試
- [ ] 執行整合測試 (進銷存流程)
- [ ] 執行安全測試 (RLS)
- [ ] 效能測試 (大量資料)
- [ ] 修復發現的問題

**交付物**: 測試報告

### 第 8 階段: 上線發布 (第 8-10 週)

**目標**: v3.0 正式上線

**工作項目**:
- [ ] 最終資料驗證
- [ ] 內部測試 (所有角色)
- [ ] 撰寫使用者文件
- [ ] 產品上線
- [ ] 監控系統運作

**交付物**: 正式上線系統

---

## 10. 測試計畫

### 10.1 單元測試

| 模組 | 測試項目 | 預期結果 |
|------|--------|--------|
| **auth.js** | login() 成功 | 返回 user 物件，token 儲存 |
| **auth.js** | hasPermission('manager') | 正確判斷角色階層 |
| **products.js** | getProducts() | 返回所有產品含庫存 |
| **inventory.js** | getLowStockProducts() | 返回低庫存商品 |
| **inventory.js** | adjustStock() | 更新庫存並記錄 |
| **purchase.js** | createPurchaseOrder() | 建立進貨單成功 |
| **purchase.js** | completePurchaseOrder() | 觸發庫存增加 |
| **sales.js** | createSalesOrder() | 建立銷售單並扣庫存 |
| **utils.js** | generateOrderNumber() | 產生唯一單號 |

### 10.2 整合測試

| 場景 | 操作 | 預期結果 |
|------|------|--------|
| **訪客查詢** | 無登入訪問快速查詢 | 能看到產品 (不含成本) |
| **進貨流程** | 建立進貨單 → 完成 | 庫存自動增加 |
| **銷售流程** | 建立銷售單 → 完成 | 庫存自動減少 |
| **庫存不足** | 銷售數量 > 庫存 | 顯示錯誤並阻止 |
| **角色限制** | staff 嘗試進貨 | 顯示無權限錯誤 |
| **報表正確** | 銷售報表查詢 | 金額統計正確 |

### 10.3 安全測試

| 攻擊類型 | 測試方法 | 預期結果 |
|--------|--------|--------|
| **RLS 越權** | staff 嘗試存取 admin 功能 | 資料庫拒絕 |
| **成本洩露** | 訪客嘗試查詢 cost_price | RLS 隱藏欄位 |
| **SQL 注入** | 在搜尋框輸入 SQL | 安全轉義 |
| **Token 竊取** | 使用過期 token | 自動登出 |

### 10.4 效能測試

| 場景 | 資料量 | 目標 | 測試方法 |
|------|------|------|--------|
| **快速查詢** | 1000 產品 | < 50ms | 瀏覽器計時 |
| **庫存查詢** | 1000 產品 | < 100ms | API 回應 |
| **報表產生** | 1000 訂單 | < 500ms | API 回應 |

---

## 11. 故障排除指南

### 11.1 常見問題

**Q: 登入後仍看不到進貨管理?**
- A: 檢查使用者角色是否為 'manager' 或 'admin'

**Q: 進貨單完成後庫存沒增加?**
- A: 確認 `process_purchase_completion` 觸發器已建立

**Q: 銷售單建立失敗顯示庫存不足?**
- A: 確認商品現有庫存 >= 銷售數量

**Q: 報表金額不正確?**
- A: 確認 `update_sales_total` 觸發器正常運作

**Q: CSV 匯出亂碼?**
- A: 確認使用 UTF-8 BOM 編碼 (`\uFEFF`)

### 11.2 調試步驟

1. **檢查瀏覽器主控台**: JavaScript 錯誤
2. **檢查 Supabase 日誌**: SQL 錯誤
3. **驗證使用者角色**: 查詢 user_roles 表
4. **測試觸發器**: 手動更新狀態檢查庫存
5. **檢查 JWT token**: 使用 jwt.io 解析

---

## 12. 維護與擴展

### 12.1 日常維護

**每日**:
- 檢查低庫存警示，及時進貨

**每週**:
- 檢查 Supabase 使用量 (500MB 限制)
- 審查銷售報表，確認數據正確
- 查看審計日誌是否有異常

**每月**:
- 備份資料 (匯出 CSV)
- 審查使用者角色
- 清理過期的審計日誌 (保留 6 個月)
- 檢視庫存報表，處理滯銷品

### 12.2 備份策略

- Supabase 免費方案: 自動每日備份
- 建議每週匯出 CSV: 產品、進貨單、銷售單
- 備份儲存: 本地 + 雲端硬碟

### 12.3 未來擴展

**v3.1 計劃** (短期):
- 條碼掃描快速銷售
- 產品圖片上傳
- 銷售單列印

**v3.2 計劃** (中期):
- 多店面支援
- 盤點功能
- 會員管理

**v4.0 計劃** (遠期):
- 行動應用版本
- 電商整合
- 進階分析 (AI 銷售預測)

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

### A. 部署前檢查清單

**資料庫設置**:
- [ ] Supabase 專案已建立
- [ ] 9 張資料表已建立 (products, suppliers, purchase_orders, purchase_items, sales_orders, sales_items, inventory_logs, user_roles, audit_logs)
- [ ] 所有 RLS 政策已啟用
- [ ] 4 個觸發器已建立 (進貨入庫、銷售扣庫存、訂單金額計算)
- [ ] 測試帳號已建立 (admin, manager, staff)

**前端設置**:
- [ ] Supabase 金鑰已設定於 config.js
- [ ] 產品資料已從 CSV 匯入
- [ ] 所有頁面功能已測試

### B. 上線後監控

**第 1 天**:
- [ ] 觀察系統運作
- [ ] 確認登入功能正常
- [ ] 測試一筆完整進銷流程

**第 7 天**:
- [ ] 檢視銷售報表正確性
- [ ] 確認庫存數量準確
- [ ] 收集使用者反饋

**第 30 天**:
- [ ] 完整系統審查
- [ ] 效能優化建議
- [ ] 規劃 v3.1 功能

### C. 資料遷移腳本

**從 Google Sheets 匯入產品**:
```javascript
// 1. 匯出 Google Sheets 為 CSV
// 2. 使用以下程式碼匯入

async function importProducts(csvData) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const product = {
      code: values[0].trim().toUpperCase(),
      name: values[1].trim(),
      selling_price: parseFloat(values[2]) || 0,
      cost_price: parseFloat(values[3]) || 0,
      stock_quantity: parseInt(values[4]) || 0,
      min_stock: parseInt(values[5]) || 5,
      category: values[6]?.trim() || null,
      barcode: values[7]?.trim() || null
    };
    
    const { error } = await supabase.from('products').insert([product]);
    if (error) console.error(`匯入失敗: ${product.code}`, error);
  }
}
```

---

**文件版本歷史**

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2025-11-17 | 初始規格文件 |
| 2.0 | 2025-11-28 | 新增 Supabase 後端架構 |
| 3.0 | 2025-12-01 | 新增進銷存管理系統 |

---

*本文件為 Orengione 進銷存系統 v3.0 完整規格書。版權所有 © 2025 Orengione。*
