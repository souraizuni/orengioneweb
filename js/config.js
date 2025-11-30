/**
 * Orengione 進銷存系統 v3.0 - 系統組態
 * 
 * 使用方式:
 * 1. 在 Supabase Dashboard 取得 URL 和 anon key
 * 2. 將下方的 SUPABASE_URL 和 SUPABASE_ANON_KEY 替換為實際值
 */

const CONFIG = {
  // ========================================
  // Supabase 連線設定 (必填)
  // ========================================
  SUPABASE_URL: 'https://your-project.supabase.co',  // 替換為您的 Supabase URL
  SUPABASE_ANON_KEY: 'your-anon-key',                 // 替換為您的 anon key

  // ========================================
  // 功能開關
  // ========================================
  FEATURES: {
    ENABLE_AUTH: true,           // 啟用認證系統
    ENABLE_INVENTORY: true,      // 啟用進銷存功能
    ENABLE_AUDIT: true,          // 啟用審計日誌
    ENABLE_GOOGLE_SHEETS: true,  // 保留 Google Sheets 相容模式
  },

  // ========================================
  // 效能設定
  // ========================================
  PERFORMANCE: {
    CACHE_TIMEOUT: 5 * 60 * 1000,    // 快取有效時間: 5 分鐘
    PAGE_SIZE: 50,                    // 每頁顯示筆數
    DEBOUNCE_DELAY: 300,              // 搜尋防抖延遲 (ms)
    MAX_SEARCH_RESULTS: 100,          // 最大搜尋結果數
  },

  // ========================================
  // 角色定義
  // ========================================
  ROLES: {
    ADMIN: 'admin',       // 管理員: 完整權限
    MANAGER: 'manager',   // 店長: 進貨+銷售+庫存+報表
    STAFF: 'staff',       // 店員: 銷售+庫存查看
  },

  // ========================================
  // 角色階層 (數字越大權限越高)
  // ========================================
  ROLE_HIERARCHY: {
    admin: 3,
    manager: 2,
    staff: 1,
  },

  // ========================================
  // 訂單編號前綴
  // ========================================
  ORDER_PREFIXES: {
    PURCHASE: 'PO',   // 進貨單
    SALES: 'SO',      // 銷售單
  },

  // ========================================
  // 付款方式
  // ========================================
  PAYMENT_METHODS: [
    { value: 'cash', label: '現金' },
    { value: 'card', label: '刷卡' },
    { value: 'transfer', label: '轉帳' },
    { value: 'linepay', label: 'LINE Pay' },
    { value: 'other', label: '其他' },
  ],

  // ========================================
  // 庫存異動類型
  // ========================================
  INVENTORY_CHANGE_TYPES: {
    PURCHASE: 'purchase',     // 進貨
    SALE: 'sale',             // 銷售
    ADJUSTMENT: 'adjustment', // 手動調整
    RETURN: 'return',         // 退貨
  },

  // ========================================
  // 訂單狀態
  // ========================================
  ORDER_STATUS: {
    PENDING: 'pending',       // 待處理
    COMPLETED: 'completed',   // 已完成
    CANCELLED: 'cancelled',   // 已取消
  },

  // ========================================
  // UI 設定
  // ========================================
  UI: {
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm',
    CURRENCY: 'NT$',
    LOW_STOCK_WARNING_COLOR: '#e74c3c',
    OUT_OF_STOCK_COLOR: '#c0392b',
  },

  // ========================================
  // 開發/除錯設定
  // ========================================
  DEBUG: {
    ENABLE_CONSOLE_LOG: true,   // 啟用 console.log
    SHOW_API_ERRORS: true,      // 顯示 API 錯誤訊息
  },
};

// 凍結設定物件，防止意外修改
Object.freeze(CONFIG);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.PERFORMANCE);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.ROLE_HIERARCHY);
Object.freeze(CONFIG.ORDER_PREFIXES);
Object.freeze(CONFIG.PAYMENT_METHODS);
Object.freeze(CONFIG.INVENTORY_CHANGE_TYPES);
Object.freeze(CONFIG.ORDER_STATUS);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.DEBUG);

// 檢查設定是否有效
function validateConfig() {
  const errors = [];
  
  if (CONFIG.SUPABASE_URL === 'https://your-project.supabase.co') {
    errors.push('請設定 SUPABASE_URL');
  }
  
  if (CONFIG.SUPABASE_ANON_KEY === 'your-anon-key') {
    errors.push('請設定 SUPABASE_ANON_KEY');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ 系統設定不完整:', errors.join(', '));
    return false;
  }
  
  console.log('✓ 系統設定驗證通過');
  return true;
}

// 匯出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, validateConfig };
}
