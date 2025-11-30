/**
 * Orengione 進銷存系統 v3.0 - 認證模組
 * 
 * 處理使用者登入、登出、角色權限
 */

// 使用者資訊快取
let currentUserCache = null;
let userRoleCache = null;

// ========================================
// 登入/登出
// ========================================

/**
 * 使用者登入
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 * @returns {Object} { user, error }
 */
async function login(email, password) {
  const supabase = getSupabase();
  if (!supabase) return { user: null, error: new Error('Supabase 未初始化') };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ 登入失敗:', error.message);
      return { user: null, error };
    }

    // 取得使用者角色
    const roleData = await getUserRole(data.user.id);

    // 快取使用者資訊
    const userInfo = {
      id: data.user.id,
      email: data.user.email,
      role: roleData?.role || CONFIG.ROLES.STAFF,
      displayName: roleData?.display_name || data.user.email,
    };

    currentUserCache = userInfo;
    userRoleCache = userInfo.role;

    // 儲存到 localStorage
    localStorage.setItem('user_info', JSON.stringify(userInfo));

    console.log('✓ 登入成功:', userInfo.displayName, `(${userInfo.role})`);
    return { user: userInfo, error: null };
  } catch (error) {
    console.error('❌ 登入例外:', error.message);
    return { user: null, error };
  }
}

/**
 * 使用者登出
 * @returns {Object} { error }
 */
async function logout() {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase 未初始化') };

  try {
    const { error } = await supabase.auth.signOut();

    // 清除快取
    currentUserCache = null;
    userRoleCache = null;

    // 清除 localStorage
    localStorage.removeItem('user_info');

    if (error) {
      console.error('❌ 登出失敗:', error.message);
      return { error };
    }

    console.log('✓ 已登出');
    return { error: null };
  } catch (error) {
    console.error('❌ 登出例外:', error.message);
    return { error };
  }
}

// ========================================
// 使用者資訊
// ========================================

/**
 * 取得目前登入的使用者
 * @returns {Object|null} 使用者物件或 null
 */
async function getCurrentUser() {
  // 優先使用快取
  if (currentUserCache) {
    return currentUserCache;
  }

  // 嘗試從 localStorage 恢復
  const stored = localStorage.getItem('user_info');
  if (stored) {
    try {
      currentUserCache = JSON.parse(stored);
      userRoleCache = currentUserCache.role;
      return currentUserCache;
    } catch (e) {
      localStorage.removeItem('user_info');
    }
  }

  // 從 Supabase 取得
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // 取得角色
    const roleData = await getUserRole(user.id);

    const userInfo = {
      id: user.id,
      email: user.email,
      role: roleData?.role || CONFIG.ROLES.STAFF,
      displayName: roleData?.display_name || user.email,
    };

    currentUserCache = userInfo;
    userRoleCache = userInfo.role;
    localStorage.setItem('user_info', JSON.stringify(userInfo));

    return userInfo;
  } catch (error) {
    console.error('取得使用者失敗:', error.message);
    return null;
  }
}

/**
 * 取得使用者角色
 * @param {string} userId - 使用者 ID
 * @returns {Object|null} 角色資料
 */
async function getUserRole(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, display_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('取得角色失敗:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('取得角色例外:', error.message);
    return null;
  }
}

// ========================================
// 權限檢查
// ========================================

/**
 * 檢查使用者是否有足夠權限
 * @param {string} requiredRole - 需要的最低角色
 * @returns {boolean} 是否有權限
 */
function hasPermission(requiredRole) {
  // 從快取或 localStorage 取得角色
  let role = userRoleCache;
  
  if (!role) {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const userInfo = JSON.parse(stored);
        role = userInfo.role;
      } catch (e) {
        return false;
      }
    }
  }

  if (!role) return false;

  const userLevel = CONFIG.ROLE_HIERARCHY[role] || 0;
  const requiredLevel = CONFIG.ROLE_HIERARCHY[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * 檢查是否為管理員
 * @returns {boolean}
 */
function isAdmin() {
  return hasPermission(CONFIG.ROLES.ADMIN);
}

/**
 * 檢查是否為店長或以上
 * @returns {boolean}
 */
function isManager() {
  return hasPermission(CONFIG.ROLES.MANAGER);
}

/**
 * 檢查是否為店員或以上
 * @returns {boolean}
 */
function isStaff() {
  return hasPermission(CONFIG.ROLES.STAFF);
}

/**
 * 檢查是否已登入
 * @returns {boolean}
 */
function isLoggedIn() {
  const stored = localStorage.getItem('user_info');
  return !!stored;
}

// ========================================
// 權限守衛
// ========================================

/**
 * 權限守衛 - 如果沒有權限則拋出錯誤
 * @param {string} requiredRole - 需要的最低角色
 * @param {string} actionName - 操作名稱 (用於錯誤訊息)
 * @throws {Error} 無權限時拋出
 */
function requirePermission(requiredRole, actionName = '此操作') {
  if (!hasPermission(requiredRole)) {
    const roleNames = {
      admin: '管理員',
      manager: '店長',
      staff: '店員',
    };
    throw new Error(`需要${roleNames[requiredRole] || requiredRole}權限才能執行${actionName}`);
  }
}

/**
 * 頁面權限守衛 - 重導向到登入頁面
 * @param {string} requiredRole - 需要的最低角色
 * @param {string} redirectUrl - 無權限時重導向的 URL
 */
function guardPage(requiredRole, redirectUrl = 'login.html') {
  if (!isLoggedIn()) {
    window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
  }

  if (!hasPermission(requiredRole)) {
    alert('您沒有權限存取此頁面');
    window.location.href = 'products.html';
    return false;
  }

  return true;
}

// ========================================
// 認證狀態監聽
// ========================================

/**
 * 監聽認證狀態變化
 * @param {Function} callback - 回呼函式 (event, session) => void
 */
function onAuthStateChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return;

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('認證狀態變更:', event);

    if (event === 'SIGNED_OUT') {
      currentUserCache = null;
      userRoleCache = null;
      localStorage.removeItem('user_info');
    }

    if (callback) {
      callback(event, session);
    }
  });
}

// ========================================
// UI 輔助函式
// ========================================

/**
 * 根據角色顯示/隱藏 UI 元素
 * @param {string} selector - CSS 選擇器
 * @param {string} requiredRole - 需要的最低角色
 */
function toggleUIByRole(selector, requiredRole) {
  const elements = document.querySelectorAll(selector);
  const hasAccess = hasPermission(requiredRole);

  elements.forEach(el => {
    el.style.display = hasAccess ? '' : 'none';
  });
}

/**
 * 更新導航列使用者資訊
 */
function updateNavUserInfo() {
  const userInfo = currentUserCache || JSON.parse(localStorage.getItem('user_info') || 'null');
  
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const loginBtnEl = document.getElementById('loginBtn');
  const logoutBtnEl = document.getElementById('logoutBtn');

  if (userInfo) {
    if (userNameEl) userNameEl.textContent = userInfo.displayName;
    if (userRoleEl) {
      const roleNames = { admin: '管理員', manager: '店長', staff: '店員' };
      userRoleEl.textContent = roleNames[userInfo.role] || userInfo.role;
    }
    if (loginBtnEl) loginBtnEl.style.display = 'none';
    if (logoutBtnEl) logoutBtnEl.style.display = '';
  } else {
    if (userNameEl) userNameEl.textContent = '';
    if (userRoleEl) userRoleEl.textContent = '';
    if (loginBtnEl) loginBtnEl.style.display = '';
    if (logoutBtnEl) logoutBtnEl.style.display = 'none';
  }
}

// ========================================
// 匯出供其他模組使用
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    login,
    logout,
    getCurrentUser,
    getUserRole,
    hasPermission,
    isAdmin,
    isManager,
    isStaff,
    isLoggedIn,
    requirePermission,
    guardPage,
    onAuthStateChange,
    toggleUIByRole,
    updateNavUserInfo,
  };
}
