-- ========================================
-- Orengione 進銷存系統 v3.0
-- Supabase 資料庫建置腳本
-- ========================================
-- 執行順序：
-- 1. 在 Supabase Dashboard > SQL Editor 執行此腳本
-- 2. 檢查所有表是否建立成功
-- 3. 建立測試使用者帳號
-- ========================================

-- ========================================
-- 1. 產品表 (products)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode VARCHAR(50),
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ========================================
-- 2. 供應商表 (suppliers)
-- ========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ========================================
-- 3. 進貨單表 (purchase_orders)
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INTEGER REFERENCES suppliers(id),
  total_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(created_at);

-- ========================================
-- 4. 進貨明細表 (purchase_items)
-- ========================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_order ON purchase_items(order_id);

-- ========================================
-- 5. 銷售單表 (sales_orders)
-- ========================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(100),
  total_amount DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - discount) STORED,
  payment_method VARCHAR(20) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(created_at);

-- ========================================
-- 6. 銷售明細表 (sales_items)
-- ========================================
CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX IF NOT EXISTS idx_sales_items_order ON sales_items(order_id);

-- ========================================
-- 7. 庫存異動記錄表 (inventory_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS inventory_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  change_type VARCHAR(20) NOT NULL,
  quantity_change INTEGER NOT NULL,
  before_quantity INTEGER NOT NULL,
  after_quantity INTEGER NOT NULL,
  reference_type VARCHAR(20),
  reference_id INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_type ON inventory_logs(change_type);

-- ========================================
-- 8. 使用者角色表 (user_roles)
-- ========================================
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- ========================================
-- 9. 審計日誌表 (audit_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- ========================================
-- 10. RLS 政策 (Row Level Security)
-- ========================================

-- 啟用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 輔助函式：檢查使用者角色
CREATE OR REPLACE FUNCTION check_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_level INTEGER;
  required_level INTEGER;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 角色階層: admin=3, manager=2, staff=1
  role_level := CASE user_role
    WHEN 'admin' THEN 3
    WHEN 'manager' THEN 2
    WHEN 'staff' THEN 1
    ELSE 0
  END;
  
  required_level := CASE required_role
    WHEN 'admin' THEN 3
    WHEN 'manager' THEN 2
    WHEN 'staff' THEN 1
    ELSE 0
  END;
  
  RETURN role_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 產品表政策
CREATE POLICY "products_read_all" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_write_manager" ON products
  FOR INSERT WITH CHECK (check_user_role('manager'));

CREATE POLICY "products_update_manager" ON products
  FOR UPDATE USING (check_user_role('manager'));

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (check_user_role('admin'));

-- 供應商表政策
CREATE POLICY "suppliers_read_manager" ON suppliers
  FOR SELECT USING (check_user_role('manager'));

CREATE POLICY "suppliers_write_admin" ON suppliers
  FOR INSERT WITH CHECK (check_user_role('admin'));

CREATE POLICY "suppliers_update_admin" ON suppliers
  FOR UPDATE USING (check_user_role('admin'));

-- 進貨單政策
CREATE POLICY "purchase_read_manager" ON purchase_orders
  FOR SELECT USING (check_user_role('manager'));

CREATE POLICY "purchase_write_manager" ON purchase_orders
  FOR INSERT WITH CHECK (check_user_role('manager'));

CREATE POLICY "purchase_update_manager" ON purchase_orders
  FOR UPDATE USING (check_user_role('manager'));

-- 進貨明細政策
CREATE POLICY "purchase_items_read_manager" ON purchase_items
  FOR SELECT USING (check_user_role('manager'));

CREATE POLICY "purchase_items_write_manager" ON purchase_items
  FOR INSERT WITH CHECK (check_user_role('manager'));

-- 銷售單政策
CREATE POLICY "sales_read_staff" ON sales_orders
  FOR SELECT USING (check_user_role('staff'));

CREATE POLICY "sales_write_staff" ON sales_orders
  FOR INSERT WITH CHECK (check_user_role('staff'));

CREATE POLICY "sales_update_manager" ON sales_orders
  FOR UPDATE USING (check_user_role('manager'));

-- 銷售明細政策
CREATE POLICY "sales_items_read_staff" ON sales_items
  FOR SELECT USING (check_user_role('staff'));

CREATE POLICY "sales_items_write_staff" ON sales_items
  FOR INSERT WITH CHECK (check_user_role('staff'));

-- 庫存異動記錄政策
CREATE POLICY "inventory_logs_read_staff" ON inventory_logs
  FOR SELECT USING (check_user_role('staff'));

CREATE POLICY "inventory_logs_write_manager" ON inventory_logs
  FOR INSERT WITH CHECK (check_user_role('manager'));

-- 使用者角色政策
CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR check_user_role('admin'));

CREATE POLICY "user_roles_write_admin" ON user_roles
  FOR INSERT WITH CHECK (check_user_role('admin'));

CREATE POLICY "user_roles_update_admin" ON user_roles
  FOR UPDATE USING (check_user_role('admin'));

-- 審計日誌政策
CREATE POLICY "audit_logs_read_admin" ON audit_logs
  FOR SELECT USING (check_user_role('admin'));

CREATE POLICY "audit_logs_write_system" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ========================================
-- 11. 自動觸發器
-- ========================================

-- 進貨單完成時自動增加庫存
CREATE OR REPLACE FUNCTION process_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    -- 更新每個商品的庫存
    UPDATE products p
    SET 
      stock_quantity = p.stock_quantity + pi.quantity,
      updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.order_id = NEW.id AND pi.product_id = p.id;
    
    -- 記錄庫存異動
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, before_quantity, after_quantity, reference_type, reference_id, created_by)
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_completion ON purchase_orders;
CREATE TRIGGER trigger_purchase_completion
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_purchase_completion();

-- 銷售單完成時自動減少庫存
CREATE OR REPLACE FUNCTION process_sale_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- 新建銷售單時直接扣庫存
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- 檢查庫存是否足夠
    IF EXISTS (
      SELECT 1 FROM sales_items si
      JOIN products p ON p.id = si.product_id
      WHERE si.order_id = NEW.id AND p.stock_quantity < si.quantity
    ) THEN
      RAISE EXCEPTION '庫存不足，無法完成銷售';
    END IF;
    
    -- 更新庫存
    UPDATE products p
    SET 
      stock_quantity = p.stock_quantity - si.quantity,
      updated_at = NOW()
    FROM sales_items si
    WHERE si.order_id = NEW.id AND si.product_id = p.id;
    
    -- 記錄庫存異動
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, before_quantity, after_quantity, reference_type, reference_id, created_by)
    SELECT 
      si.product_id,
      'sale',
      -si.quantity,
      p.stock_quantity + si.quantity,
      p.stock_quantity,
      'sales_order',
      NEW.id,
      NEW.created_by
    FROM sales_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sale_completion ON sales_orders;
CREATE TRIGGER trigger_sale_completion
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION process_sale_completion();

-- 自動計算進貨單總金額
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_purchase_total ON purchase_items;
CREATE TRIGGER trigger_update_purchase_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_total();

-- 自動計算銷售單總金額
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_total ON sales_items;
CREATE TRIGGER trigger_update_sales_total
  AFTER INSERT OR UPDATE OR DELETE ON sales_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_total();

-- ========================================
-- 12. 完成訊息
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Orengione 進銷存系統 v3.0 資料庫建置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已建立:';
  RAISE NOTICE '  - 9 張資料表';
  RAISE NOTICE '  - RLS 安全政策';
  RAISE NOTICE '  - 4 個自動觸發器';
  RAISE NOTICE '';
  RAISE NOTICE '下一步:';
  RAISE NOTICE '  1. 在 Authentication > Users 建立使用者';
  RAISE NOTICE '  2. 在 user_roles 表設定使用者角色';
  RAISE NOTICE '  3. 更新前端 config.js 的連線資訊';
  RAISE NOTICE '========================================';
END $$;
