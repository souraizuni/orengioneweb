/**
 * Orengione 進銷存系統 v3.0 - Supabase 客戶端
 * 
 * 封裝 Supabase SDK，提供統一的 API 介面
 */

// Supabase 客戶端實例
let supabaseClient = null;

/**
 * 初始化 Supabase 客戶端
 * @returns {Object} Supabase 客戶端實例
 */
function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!validateConfig()) {
    console.error('❌ Supabase 初始化失敗: 設定不完整');
    return null;
  }

  try {
    supabaseClient = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );

    console.log('✓ Supabase 客戶端初始化成功');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Supabase 初始化失敗:', error.message);
    return null;
  }
}

/**
 * 取得 Supabase 客戶端
 * @returns {Object} Supabase 客戶端實例
 */
function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * 通用查詢包裝器 - 處理錯誤和日誌
 * @param {Function} queryFn - 查詢函式
 * @param {string} operationName - 操作名稱 (用於日誌)
 * @returns {Object} { data, error }
 */
async function executeQuery(queryFn, operationName = 'query') {
  try {
    const startTime = performance.now();
    const result = await queryFn();
    const duration = Math.round(performance.now() - startTime);

    if (result.error) {
      if (CONFIG.DEBUG.SHOW_API_ERRORS) {
        console.error(`❌ ${operationName} 失敗:`, result.error.message);
      }
      return { data: null, error: result.error };
    }

    if (CONFIG.DEBUG.ENABLE_CONSOLE_LOG) {
      console.log(`✓ ${operationName} 完成 (${duration}ms)`);
    }

    return { data: result.data, error: null };
  } catch (error) {
    if (CONFIG.DEBUG.SHOW_API_ERRORS) {
      console.error(`❌ ${operationName} 例外:`, error.message);
    }
    return { data: null, error };
  }
}

// ========================================
// 產品相關 API
// ========================================

/**
 * 取得所有產品
 * @param {Object} options - 查詢選項
 * @returns {Object} { data, error }
 */
async function getProducts(options = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }, '取得產品列表');
}

/**
 * 取得單一產品
 * @param {number} id - 產品 ID
 * @returns {Object} { data, error }
 */
async function getProduct(id) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    return await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
  }, `取得產品 #${id}`);
}

/**
 * 新增產品
 * @param {Object} productData - 產品資料
 * @returns {Object} { data, error }
 */
async function createProduct(productData) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  return executeQuery(async () => {
    return await supabase
      .from('products')
      .insert([{
        ...productData,
        code: productData.code.toUpperCase(),
        created_by: user.id,
      }])
      .select();
  }, '新增產品');
}

/**
 * 更新產品
 * @param {number} id - 產品 ID
 * @param {Object} productData - 更新資料
 * @returns {Object} { data, error }
 */
async function updateProduct(id, productData) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  return executeQuery(async () => {
    return await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .select();
  }, `更新產品 #${id}`);
}

/**
 * 刪除產品 (軟刪除)
 * @param {number} id - 產品 ID
 * @returns {Object} { data, error }
 */
async function deleteProduct(id) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    return await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);
  }, `刪除產品 #${id}`);
}

// ========================================
// 庫存相關 API
// ========================================

/**
 * 取得低庫存產品
 * @returns {Object} { data, error }
 */
async function getLowStockProducts() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    // 使用 RPC 函式或直接查詢
    return await supabase
      .from('products')
      .select('id, code, name, category, stock_quantity, min_stock')
      .eq('is_active', true)
      .lte('stock_quantity', supabase.raw('min_stock'))
      .order('stock_quantity');
  }, '取得低庫存產品');
}

/**
 * 調整庫存
 * @param {number} productId - 產品 ID
 * @param {number} adjustment - 調整數量 (正數增加，負數減少)
 * @param {string} reason - 調整原因
 * @returns {Object} { data, error }
 */
async function adjustStock(productId, adjustment, reason) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  // 先取得目前庫存
  const { data: product, error: fetchError } = await getProduct(productId);
  if (fetchError) return { data: null, error: fetchError };

  const beforeQty = product.stock_quantity;
  const afterQty = beforeQty + adjustment;

  if (afterQty < 0) {
    return { data: null, error: new Error('調整後庫存不能為負數') };
  }

  // 更新庫存
  const { error: updateError } = await updateProduct(productId, {
    stock_quantity: afterQty,
  });
  if (updateError) return { data: null, error: updateError };

  // 記錄庫存異動
  const { error: logError } = await executeQuery(async () => {
    return await supabase
      .from('inventory_logs')
      .insert([{
        product_id: productId,
        change_type: CONFIG.INVENTORY_CHANGE_TYPES.ADJUSTMENT,
        quantity_change: adjustment,
        before_quantity: beforeQty,
        after_quantity: afterQty,
        reference_type: 'manual',
        notes: reason,
        created_by: user.id,
      }]);
  }, '記錄庫存異動');

  if (logError) {
    console.warn('庫存異動記錄失敗:', logError.message);
  }

  return { data: { beforeQty, afterQty }, error: null };
}

/**
 * 取得庫存異動記錄
 * @param {Object} options - 查詢選項
 * @returns {Object} { data, error }
 */
async function getInventoryLogs(options = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    let query = supabase
      .from('inventory_logs')
      .select(`
        *,
        products (code, name)
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

    return await query;
  }, '取得庫存異動記錄');
}

// ========================================
// 供應商相關 API
// ========================================

/**
 * 取得所有供應商
 * @returns {Object} { data, error }
 */
async function getSuppliers() {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    return await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');
  }, '取得供應商列表');
}

/**
 * 新增供應商
 * @param {Object} supplierData - 供應商資料
 * @returns {Object} { data, error }
 */
async function createSupplier(supplierData) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  return executeQuery(async () => {
    return await supabase
      .from('suppliers')
      .insert([{
        ...supplierData,
        created_by: user.id,
      }])
      .select();
  }, '新增供應商');
}

// ========================================
// 進貨單相關 API
// ========================================

/**
 * 取得進貨單列表
 * @param {Object} options - 查詢選項
 * @returns {Object} { data, error }
 */
async function getPurchaseOrders(options = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers (name),
        purchase_items (
          id, quantity, unit_cost, subtotal,
          products (code, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }, '取得進貨單列表');
}

/**
 * 建立進貨單
 * @param {Object} orderData - 進貨單資料
 * @param {Array} items - 進貨明細
 * @returns {Object} { data, error }
 */
async function createPurchaseOrder(orderData, items) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  // 產生單號
  const orderNumber = await generateOrderNumber(CONFIG.ORDER_PREFIXES.PURCHASE);

  // 建立進貨單
  const { data: order, error: orderError } = await executeQuery(async () => {
    return await supabase
      .from('purchase_orders')
      .insert([{
        order_number: orderNumber,
        supplier_id: orderData.supplierId || null,
        notes: orderData.notes || '',
        status: CONFIG.ORDER_STATUS.PENDING,
        created_by: user.id,
      }])
      .select()
      .single();
  }, '建立進貨單');

  if (orderError) return { data: null, error: orderError };

  // 建立進貨明細
  const itemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_cost: item.unitCost,
  }));

  const { error: itemsError } = await executeQuery(async () => {
    return await supabase
      .from('purchase_items')
      .insert(itemsData);
  }, '建立進貨明細');

  if (itemsError) return { data: null, error: itemsError };

  return { data: order, error: null };
}

/**
 * 完成進貨單 (觸發庫存增加)
 * @param {number} orderId - 進貨單 ID
 * @returns {Object} { data, error }
 */
async function completePurchaseOrder(orderId) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    return await supabase
      .from('purchase_orders')
      .update({ status: CONFIG.ORDER_STATUS.COMPLETED })
      .eq('id', orderId)
      .select();
  }, `完成進貨單 #${orderId}`);
}

// ========================================
// 銷售單相關 API
// ========================================

/**
 * 取得銷售單列表
 * @param {Object} options - 查詢選項
 * @returns {Object} { data, error }
 */
async function getSalesOrders(options = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  return executeQuery(async () => {
    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        sales_items (
          id, quantity, unit_price, subtotal,
          products (code, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
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

    return await query;
  }, '取得銷售單列表');
}

/**
 * 建立銷售單 (自動扣庫存)
 * @param {Object} orderData - 銷售單資料
 * @param {Array} items - 銷售明細
 * @returns {Object} { data, error }
 */
async function createSalesOrder(orderData, items) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase 未初始化') };

  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('未登入') };

  // 檢查庫存是否足夠
  for (const item of items) {
    const { data: product } = await getProduct(item.productId);
    if (product && product.stock_quantity < item.quantity) {
      return {
        data: null,
        error: new Error(`商品 "${product.name}" 庫存不足 (現有: ${product.stock_quantity}, 需求: ${item.quantity})`),
      };
    }
  }

  // 產生單號
  const orderNumber = await generateOrderNumber(CONFIG.ORDER_PREFIXES.SALES);

  // 建立銷售單
  const { data: order, error: orderError } = await executeQuery(async () => {
    return await supabase
      .from('sales_orders')
      .insert([{
        order_number: orderNumber,
        customer_name: orderData.customerName || '',
        discount: orderData.discount || 0,
        payment_method: orderData.paymentMethod || 'cash',
        notes: orderData.notes || '',
        status: CONFIG.ORDER_STATUS.COMPLETED, // 銷售單直接完成
        created_by: user.id,
      }])
      .select()
      .single();
  }, '建立銷售單');

  if (orderError) return { data: null, error: orderError };

  // 建立銷售明細
  const itemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await executeQuery(async () => {
    return await supabase
      .from('sales_items')
      .insert(itemsData);
  }, '建立銷售明細');

  if (itemsError) return { data: null, error: itemsError };

  return { data: order, error: null };
}

// ========================================
// 報表相關 API
// ========================================

/**
 * 取得銷售報表
 * @param {string} startDate - 開始日期
 * @param {string} endDate - 結束日期
 * @returns {Object} { data, error }
 */
async function getSalesReport(startDate, endDate) {
  const { data: orders, error } = await getSalesOrders({
    status: CONFIG.ORDER_STATUS.COMPLETED,
    startDate,
    endDate,
  });

  if (error) return { data: null, error };

  // 計算統計
  const summary = {
    totalOrders: orders.length,
    totalRevenue: 0,
    totalDiscount: 0,
    byPaymentMethod: {},
    byCategory: {},
    topProducts: {},
  };

  orders.forEach(order => {
    summary.totalRevenue += parseFloat(order.final_amount || 0);
    summary.totalDiscount += parseFloat(order.discount || 0);

    // 付款方式統計
    const method = order.payment_method || 'other';
    summary.byPaymentMethod[method] = (summary.byPaymentMethod[method] || 0) + parseFloat(order.final_amount || 0);

    // 商品統計
    if (order.sales_items) {
      order.sales_items.forEach(item => {
        const code = item.products?.code || 'unknown';
        if (!summary.topProducts[code]) {
          summary.topProducts[code] = {
            name: item.products?.name || '未知',
            quantity: 0,
            revenue: 0,
          };
        }
        summary.topProducts[code].quantity += item.quantity;
        summary.topProducts[code].revenue += parseFloat(item.subtotal || 0);
      });
    }
  });

  return { data: { orders, summary }, error: null };
}

/**
 * 取得庫存報表
 * @returns {Object} { data, error }
 */
async function getInventoryReport() {
  const { data: products, error } = await getProducts();
  if (error) return { data: null, error };

  const summary = {
    totalProducts: products.length,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    byCategory: {},
  };

  products.forEach(p => {
    const stockValue = p.stock_quantity * (p.cost_price || 0);
    summary.totalStockValue += stockValue;

    if (p.stock_quantity === 0) {
      summary.outOfStockCount++;
    } else if (p.stock_quantity <= p.min_stock) {
      summary.lowStockCount++;
    }

    const cat = p.category || '未分類';
    if (!summary.byCategory[cat]) {
      summary.byCategory[cat] = { count: 0, stockValue: 0 };
    }
    summary.byCategory[cat].count++;
    summary.byCategory[cat].stockValue += stockValue;
  });

  return { data: { products, summary }, error: null };
}

// ========================================
// 匯出供其他模組使用
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSupabase,
    getSupabase,
    executeQuery,
    // 產品
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    // 庫存
    getLowStockProducts,
    adjustStock,
    getInventoryLogs,
    // 供應商
    getSuppliers,
    createSupplier,
    // 進貨
    getPurchaseOrders,
    createPurchaseOrder,
    completePurchaseOrder,
    // 銷售
    getSalesOrders,
    createSalesOrder,
    // 報表
    getSalesReport,
    getInventoryReport,
  };
}
