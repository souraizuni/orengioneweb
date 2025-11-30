/**
 * Orengione 進銷存系統 v3.0 - 工具函式
 */

// ========================================
// 訂單編號產生
// ========================================

/**
 * 產生訂單編號: XX-YYYYMMDD-XXX
 * @param {string} prefix - 前綴 (PO/SO)
 * @returns {string} 訂單編號
 */
async function generateOrderNumber(prefix) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const pattern = `${prefix}-${today}-%`;

  const supabase = getSupabase();
  if (!supabase) {
    // 如果無法連線，使用時間戳
    return `${prefix}-${today}-${Date.now().toString().slice(-3)}`;
  }

  // 查詢今日最後一筆單號
  const tableName = prefix === 'PO' ? 'purchase_orders' : 'sales_orders';
  
  try {
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
  } catch (error) {
    console.error('產生單號失敗:', error.message);
    return `${prefix}-${today}-${Date.now().toString().slice(-3)}`;
  }
}

// ========================================
// 格式化函式
// ========================================

/**
 * 格式化金額
 * @param {number} amount - 金額
 * @param {boolean} showCurrency - 是否顯示貨幣符號
 * @returns {string}
 */
function formatCurrency(amount, showCurrency = true) {
  const formatted = new Intl.NumberFormat('zh-TW').format(amount || 0);
  return showCurrency ? `${CONFIG.UI.CURRENCY} ${formatted}` : formatted;
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {boolean} showTime - 是否顯示時間
 * @returns {string}
 */
function formatDate(date, showTime = false) {
  if (!date) return '-';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (!showTime) {
    return `${year}-${month}-${day}`;
  }
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化數量 (含庫存警示顏色)
 * @param {number} quantity - 數量
 * @param {number} minStock - 最低庫存
 * @returns {Object} { text, color, icon }
 */
function formatStockQuantity(quantity, minStock = 5) {
  if (quantity === 0) {
    return {
      text: '0',
      color: CONFIG.UI.OUT_OF_STOCK_COLOR,
      icon: '🔴',
      status: 'out',
    };
  }
  
  if (quantity <= minStock) {
    return {
      text: String(quantity),
      color: CONFIG.UI.LOW_STOCK_WARNING_COLOR,
      icon: '⚠️',
      status: 'low',
    };
  }
  
  return {
    text: String(quantity),
    color: '#333',
    icon: '',
    status: 'ok',
  };
}

// ========================================
// HTML 安全處理
// ========================================

/**
 * HTML 轉義
 * @param {string} text - 原始文字
 * @returns {string} 轉義後的文字
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 安全地設定元素內容
 * @param {HTMLElement} element - DOM 元素
 * @param {string} text - 文字內容
 */
function setTextContent(element, text) {
  if (element) {
    element.textContent = text || '';
  }
}

// ========================================
// 表單處理
// ========================================

/**
 * 從表單取得資料
 * @param {HTMLFormElement} form - 表單元素
 * @returns {Object} 表單資料物件
 */
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  
  formData.forEach((value, key) => {
    data[key] = value;
  });
  
  return data;
}

/**
 * 驗證必填欄位
 * @param {Object} data - 資料物件
 * @param {Array} requiredFields - 必填欄位名稱陣列
 * @returns {Object} { valid, errors }
 */
function validateRequired(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} 為必填欄位`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========================================
// 防抖與節流
// ========================================

/**
 * 防抖函式
 * @param {Function} fn - 要執行的函式
 * @param {number} delay - 延遲時間 (ms)
 * @returns {Function}
 */
function debounce(fn, delay = CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
  let timer = null;
  
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 節流函式
 * @param {Function} fn - 要執行的函式
 * @param {number} limit - 時間限制 (ms)
 * @returns {Function}
 */
function throttle(fn, limit = 100) {
  let lastCall = 0;
  
  return function (...args) {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// ========================================
// CSV 匯出
// ========================================

/**
 * 匯出資料為 CSV
 * @param {Array} data - 資料陣列
 * @param {string} filename - 檔案名稱 (不含副檔名)
 * @param {Array} headers - 欄位名稱 (可選)
 */
function exportToCSV(data, filename, headers = null) {
  if (!data || data.length === 0) {
    console.warn('無資料可匯出');
    return;
  }
  
  // 取得欄位
  const keys = headers || Object.keys(data[0]);
  
  // 建立 CSV 內容
  const csvContent = [
    keys.join(','),
    ...data.map(row => 
      keys.map(k => {
        let value = row[k];
        if (value === null || value === undefined) {
          value = '';
        }
        // 處理包含逗號或引號的值
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');
  
  // 加入 BOM 以支援 Excel 中文
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 下載
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${formatDate(new Date())}.csv`;
  link.click();
  
  // 清理
  URL.revokeObjectURL(link.href);
}

// ========================================
// 本地儲存
// ========================================

/**
 * 儲存到 localStorage
 * @param {string} key - 鍵
 * @param {*} value - 值
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('儲存失敗:', e.message);
  }
}

/**
 * 從 localStorage 讀取
 * @param {string} key - 鍵
 * @param {*} defaultValue - 預設值
 * @returns {*}
 */
function loadFromStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error('讀取失敗:', e.message);
    return defaultValue;
  }
}

// ========================================
// UI 輔助
// ========================================

/**
 * 顯示提示訊息
 * @param {string} message - 訊息
 * @param {string} type - 類型 (success/error/warning/info)
 * @param {number} duration - 顯示時間 (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
  // 移除現有的 toast
  const existing = document.querySelector('.toast-message');
  if (existing) {
    existing.remove();
  }
  
  // 建立 toast 元素
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: toastIn 0.3s ease;
  `;
  
  // 設定顏色
  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
  };
  toast.style.backgroundColor = colors[type] || colors.info;
  
  document.body.appendChild(toast);
  
  // 自動移除
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 顯示確認對話框
 * @param {string} message - 訊息
 * @param {string} title - 標題
 * @returns {Promise<boolean>}
 */
function showConfirm(message, title = '確認') {
  return new Promise(resolve => {
    resolve(confirm(`${title}\n\n${message}`));
  });
}

/**
 * 顯示載入中
 * @param {boolean} show - 是否顯示
 */
function showLoading(show = true) {
  let overlay = document.getElementById('loadingOverlay');
  
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        ">
          <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
          ">
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <div>載入中...</div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  } else {
    if (overlay) {
      overlay.remove();
    }
  }
}

// ========================================
// 條碼處理
// ========================================

/**
 * 清理條碼 (移除空格和非數字)
 * @param {string} barcode - 原始條碼
 * @returns {string}
 */
function cleanBarcode(barcode) {
  if (!barcode) return '';
  return String(barcode).replace(/\s/g, '').replace(/[^0-9]/g, '');
}

/**
 * 檢查條碼是否有效 (EAN-13)
 * @param {string} barcode - 條碼
 * @returns {boolean}
 */
function isValidBarcode(barcode) {
  const cleaned = cleanBarcode(barcode);
  return cleaned.length === 13;
}

// ========================================
// 添加 CSS 動畫
// ========================================
(function addToastStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, -20px); }
    }
  `;
  document.head.appendChild(style);
})();

// ========================================
// 匯出供其他模組使用
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateOrderNumber,
    formatCurrency,
    formatDate,
    formatStockQuantity,
    escapeHtml,
    setTextContent,
    getFormData,
    validateRequired,
    debounce,
    throttle,
    exportToCSV,
    saveToStorage,
    loadFromStorage,
    showToast,
    showConfirm,
    showLoading,
    cleanBarcode,
    isValidBarcode,
  };
}
