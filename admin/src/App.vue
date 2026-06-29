<template>
  <div class="app-container-root">
    <!-- AUTHENTICATION FORM SCREEN -->
        <div class="login-screen" v-if="!isLoggedIn">
            <div class="login-card" style="position: relative;">
                <!-- Environment Switcher for Login Screen -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 12px; margin-top: -10px;">
                    <select id="env-switcher-login" v-model="currentEnv" @change="changeEnvironment"
                        style="width: 105px; font-weight: 600; border-radius: 8px; height: 36px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 8px; cursor: pointer;">
                        <option value="local">💻 Local</option>
                        <option value="dev">⚙️ Dev</option>
                        <option value="prod">🚀 Prod</option>
                    </select>
                </div>
                <div class="login-logo"
                    style="color: #ffffff; font-size: 1.8rem; font-weight: 800; font-family: var(--font-display); text-transform: uppercase; margin-bottom: 8px;">
                    {{ authMode === 'login' ? 'Warehouse Admin' : 'Register Merchant' }}
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 24px; font-weight: 500;">
                    {{ authMode === 'login' ? 'Enterprise Management Portal Authentication' : 'Create a new Brand owner account' }}</p>
                <form @submit.prevent="authMode === 'login' ? handleLogin() : handleRegister()">
                    <div class="form-group" style="margin-bottom: 16px; text-align: left;">
                        <label
                            style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">Operator
                            Email</label>
                        <input type="email" v-model="loginEmail" required autocomplete="username"
                            placeholder="email">
                    </div>
                    <div class="form-group" style="margin-bottom: 24px; text-align: left;">
                        <label
                            style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">Access
                            Password</label>
                        <input type="password" v-model="loginPassword" required autocomplete="current-password" placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn btn-accent" style="width: 100%; font-weight: 700; height: 42px;">
                        {{ authMode === 'login' ? 'Authenticate & Launch' : 'Create Account' }}
                    </button>
                    <div style="margin-top: 16px; text-align: center;">
                        <a href="#" @click.prevent="authMode = (authMode === 'login' ? 'register' : 'login'); loginError = '';" style="color: var(--accent); font-size: 0.8rem; font-weight: 600; text-decoration: none;">
                            {{ authMode === 'login' ? "Don't have an account? Register here" : "Already have an account? Log in here" }}
                        </a>
                    </div>
                    <div style="color: #ef4444; font-size: 0.8rem; margin-top: 14px; text-align: center;" v-if="loginError">
                        {{ loginError }}
                    </div>
                </form>
            </div>
        </div>

        <!-- FULLSCREEN BRAND ONBOARDING WIZARD -->
        <div v-else-if="needsOnboarding" style="display: flex; flex-direction: column; width: 100vw; min-height: 100vh; background: var(--bg-color); padding: 40px; box-sizing: border-box; overflow-y: auto; z-index: 10;">
             <!-- Header branding bar -->
             <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 30px; max-width: 900px; width: 100%; margin-left: auto; margin-right: auto;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: -0.02em;">
                      <span>⚡ Onboard Your Brand Shop</span>
                  </div>
                  <button type="button" @click="handleLogout" class="btn" style="background: transparent; border: 1px solid var(--border); color: var(--text-muted); font-weight: 600; padding: 6px 14px; margin: 0; font-size: 0.8rem; cursor: pointer;">
                      🚪 Log Out
                  </button>
             </div>
             
             <!-- Onboarding wizard component container -->
             <div style="max-width: 900px; width: 100%; margin: 0 auto; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); box-sizing: border-box;">
                  <!-- We render the onboarding wizard right here! -->
                  <BrandsView ref="brandsViewOnboarding" :force-create-wizard="true" />
             </div>
        </div>

        <div v-else style="display: flex; min-height: 100vh; width: 100%;">
            <!-- Touch overlay to close mobile sidebar -->
            <div class="mobile-sidebar-overlay" :class="{ open: mobileSidebarOpen }" @click="mobileSidebarOpen = false">
            </div>

            <!-- SIDEBAR NAVIGATION MENU -->
            <aside :class="{ open: mobileSidebarOpen }" v-if="isLoggedIn && !isCampaignCreatorFullscreen">
            <!-- Top Workspace / Context Selector -->
            <div style="position: relative; margin-bottom: 24px;">
                <div class="profile-selector-btn" @click.stop="userRole.toLowerCase() === 'superadmin' ? (workspaceDropdownOpen = !workspaceDropdownOpen) : null"
                    :style="{ cursor: userRole.toLowerCase() === 'superadmin' ? 'pointer' : 'default' }"
                    style="margin-bottom: 0;">
                    <div class="workspace-selector-avatar" 
                         :style="{ background: activeWorkspaceFavicon ? '#ffffff' : '#1a1d1f', border: activeWorkspaceFavicon ? '1px solid rgba(255,255,255,0.1)' : 'none' }"
                         style="display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px;">
                        <img v-if="activeWorkspaceFavicon" :src="activeWorkspaceFavicon" style="width: 100%; height: 100%; object-fit: contain; padding: 4px; box-sizing: border-box;" alt="favicon" />
                        <span v-else>{{ activeWorkspaceLetter }}</span>
                    </div>
                    <div class="profile-selector-meta">
                        <div
                            style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em; line-height: 1; display: flex; align-items: center; gap: 6px;">
                            <span>{{ activeWorkspaceRoleLabel }}</span>
                            <span v-if="activeWorkspaceTier" 
                                  style="font-size: 0.58rem; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(197, 160, 89, 0.15); color: var(--accent); letter-spacing: 0;">
                                {{ activeWorkspaceTier }}
                            </span>
                            <span v-if="activeWorkspaceFreeTier"
                                  style="font-size: 0.58rem; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; letter-spacing: 0;">
                                FREE
                            </span>
                        </div>
                        <div class="profile-selector-title"
                            style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 4px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {{ activeWorkspaceName }}</div>
                    </div>
                    <span class="profile-selector-arrow" style="color: var(--text-muted); font-size: 0.65rem;" v-if="userRole.toLowerCase() === 'superadmin'">▼</span>
                </div>

                <!-- Custom Workspace switcher dropdown list -->
                <div class="workspace-dropdown-menu" v-if="workspaceDropdownOpen">
                    <div class="workspace-dropdown-item" :class="{ active: activeShopFilter === 'all' }"
                        @click="selectWorkspace('all')">
                        <div class="workspace-dropdown-icon">🌐</div>
                        <div class="workspace-dropdown-text">
                            <strong>All Brands</strong>
                            <span>Show consolidated metrics</span>
                        </div>
                    </div>
                    <div class="workspace-dropdown-divider"></div>
                    <div class="workspace-dropdown-section-title">Brands</div>
                    <div class="workspace-dropdown-item" v-for="b in activeBrands" :key="b.id"
                        :class="{ active: activeShopFilter === b.id }" @click="selectWorkspace(b.id)">
                        <div class="workspace-dropdown-avatar" 
                             :style="{ background: b.favicon ? '#ffffff' : '#1a1d1f' }"
                             style="width: 20px; height: 20px; font-size: 0.75rem; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                            <img v-if="b.favicon" :src="b.favicon" style="width: 100%; height: 100%; object-fit: contain; padding: 2px; box-sizing: border-box;" alt="favicon" />
                            <span v-else>{{ b.name.charAt(0) }}</span>
                        </div>
                        <div class="workspace-dropdown-text">
                            <strong style="display: flex; align-items: center; gap: 6px;">
                                <span>{{ b.name }}</span>
                                <span style="font-size: 0.58rem; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(197, 160, 89, 0.15); color: var(--accent); text-transform: uppercase;">
                                    {{ b.ai_tier || 'professional' }}
                                </span>
                                <span v-if="b.ai_free_tier" style="font-size: 0.58rem; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; text-transform: uppercase;">
                                    FREE
                                </span>
                            </strong>
                            <span>{{ getBrandSubdomain(b) }}</span>
                        </div>
                    </div>
                    <div class="workspace-dropdown-divider"></div>
                    <div class="workspace-dropdown-item action-item" @click="selectWorkspace('create')"
                        style="color: var(--accent);">
                        <div class="workspace-dropdown-icon">➕</div>
                        <div class="workspace-dropdown-text">
                            <strong style="color: var(--accent);">Spin Up New Brand</strong>
                            <span>Provision subdomain & stack</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar-nav-container">
                <!-- Group 1: Main Menu -->
                <div class="nav-group">
                <div class="nav-group-title">Main Menu</div>
                <ul class="nav-links">
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'overview' }"
                            @click="switchView('overview')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Dashboard
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'brand-center', 'generating-purple-glow': isStrategyGenerating }"
                            :disabled="isSidebarLinkDisabled('brand-center')"
                            :style="{ opacity: isSidebarLinkDisabled('brand-center') ? 0.35 : 1, cursor: isSidebarLinkDisabled('brand-center') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('brand-center')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                            </svg>
                            Brand Center <span v-if="isSidebarLinkDisabled('brand-center')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'products' }"
                            :disabled="isSidebarLinkDisabled('products')"
                            :style="{ opacity: isSidebarLinkDisabled('products') ? 0.35 : 1, cursor: isSidebarLinkDisabled('products') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('products')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path
                                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z">
                                </path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            Products <span v-if="isSidebarLinkDisabled('products')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'media' }"
                            :disabled="isSidebarLinkDisabled('media')"
                            :style="{ opacity: isSidebarLinkDisabled('media') ? 0.35 : 1, cursor: isSidebarLinkDisabled('media') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('media')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            Media Library <span v-if="isSidebarLinkDisabled('media')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'orders' }"
                            :disabled="isSidebarLinkDisabled('orders')"
                            :style="{ opacity: isSidebarLinkDisabled('orders') ? 0.35 : 1, cursor: isSidebarLinkDisabled('orders') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('orders')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            Transactions <span v-if="isSidebarLinkDisabled('orders')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'reports' }"
                            :disabled="isSidebarLinkDisabled('reports')"
                            :style="{ opacity: isSidebarLinkDisabled('reports') ? 0.35 : 1, cursor: isSidebarLinkDisabled('reports') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('reports')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Reports & Analytics <span v-if="isSidebarLinkDisabled('reports')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'messages' }"
                            :disabled="isSidebarLinkDisabled('messages')"
                            :style="{ opacity: isSidebarLinkDisabled('messages') ? 0.35 : 1, cursor: isSidebarLinkDisabled('messages') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('messages')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Messages <span v-if="isSidebarLinkDisabled('messages')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'team-performance' }"
                            :disabled="isSidebarLinkDisabled('team-performance')"
                            :style="{ opacity: isSidebarLinkDisabled('team-performance') ? 0.35 : 1, cursor: isSidebarLinkDisabled('team-performance') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('team-performance')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Team Performance <span v-if="isSidebarLinkDisabled('team-performance')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'campaigns' }"
                            :disabled="isSidebarLinkDisabled('campaigns')"
                            :style="{ opacity: isSidebarLinkDisabled('campaigns') ? 0.35 : 1, cursor: isSidebarLinkDisabled('campaigns') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('campaigns')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                            Ad Studio <span v-if="isSidebarLinkDisabled('campaigns')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'learning' }"
                            :disabled="isSidebarLinkDisabled('learning')"
                            :style="{ opacity: isSidebarLinkDisabled('learning') ? 0.35 : 1, cursor: isSidebarLinkDisabled('learning') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('learning')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                            </svg>
                            AI Learning Center <span v-if="isSidebarLinkDisabled('learning')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'coupons' }"
                            :disabled="isSidebarLinkDisabled('coupons')"
                            :style="{ opacity: isSidebarLinkDisabled('coupons') ? 0.35 : 1, cursor: isSidebarLinkDisabled('coupons') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('coupons')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                <line x1="7" y1="8" x2="17" y2="8"></line>
                                <line x1="7" y1="12" x2="17" y2="12"></line>
                                <line x1="7" y1="16" x2="13" y2="16"></line>
                            </svg>
                            Coupons <span v-if="isSidebarLinkDisabled('coupons')">🔒</span>
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Group 2: Customers -->
            <div class="nav-group">
                <div class="nav-group-title">Customers</div>
                <ul class="nav-links">
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'customers' }"
                            :disabled="isSidebarLinkDisabled('customers')"
                            :style="{ opacity: isSidebarLinkDisabled('customers') ? 0.35 : 1, cursor: isSidebarLinkDisabled('customers') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('customers')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Customer List <span v-if="isSidebarLinkDisabled('customers')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'brands' }"
                            @click="switchView('brands')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                            </svg>
                            Channels
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Group 3: Management -->
            <div class="nav-group">
                <div class="nav-group-title">Management</div>
                <ul class="nav-links">
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'roles-permissions' }"
                            :disabled="isSidebarLinkDisabled('roles-permissions')"
                            :style="{ opacity: isSidebarLinkDisabled('roles-permissions') ? 0.35 : 1, cursor: isSidebarLinkDisabled('roles-permissions') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('roles-permissions')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Roles & Permissions <span v-if="isSidebarLinkDisabled('roles-permissions')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'billing-subscription' }"
                            @click="switchView('billing-subscription')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            Billing & Subscription
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'ai-analytics' }"
                            @click="switchView('ai-analytics')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                                <rect x="9" y="9" width="6" height="6" />
                                <line x1="9" y1="1" x2="9" y2="4" />
                                <line x1="15" y1="1" x2="15" y2="4" />
                                <line x1="9" y1="20" x2="9" y2="23" />
                                <line x1="15" y1="20" x2="15" y2="23" />
                                <line x1="20" y1="9" x2="23" y2="9" />
                                <line x1="20" y1="15" x2="23" y2="15" />
                                <line x1="1" y1="9" x2="4" y2="9" />
                                <line x1="1" y1="15" x2="4" y2="15" />
                            </svg>
                            AI Console & Analytics
                        </button>
                    </li>
                    <li v-if="userRole.toLowerCase() !== 'superadmin' || activeShopFilter !== 'all'">
                        <button class="nav-link-btn" :class="{ active: activeView === 'settings' }"
                            @click="switchView('settings')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            Integrations
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Group 4: Settings -->
            <div class="nav-group">
                <div class="nav-group-title">Settings</div>
                <ul class="nav-links">
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'customer-support' }"
                            :disabled="isSidebarLinkDisabled('customer-support')"
                            :style="{ opacity: isSidebarLinkDisabled('customer-support') ? 0.35 : 1, cursor: isSidebarLinkDisabled('customer-support') ? 'not-allowed' : 'pointer' }"
                            @click="switchView('customer-support')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path
                                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z">
                                </path>
                            </svg>
                            Customer Support <span v-if="isSidebarLinkDisabled('customer-support')">🔒</span>
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'help' }"
                            @click="switchView('help')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            Help Center
                        </button>
                    </li>
                    <li v-if="userRole.toLowerCase() === 'superadmin' && activeShopFilter === 'all'">
                        <button class="nav-link-btn" :class="{ active: activeView === 'settings' }" @click="switchView('settings')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            System Settings
                        </button>
                    </li>
                </ul>
            </div>
            </div> <!-- end .sidebar-nav-container -->

            <!-- Profile Selector Dropdown Menu -->
            <div class="profile-dropdown-menu" v-if="profileDropdownOpen" style="position: absolute; bottom: 80px; left: 20px; right: 20px;">
                <div class="profile-dropdown-header">
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.85rem;">{{ operatorName }}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">{{ loginEmail }}</div>
                </div>
                <div class="profile-dropdown-divider"></div>
                
                <!-- If acting as merchant, show switch back -->
                <button v-if="userRole.toLowerCase() === 'merchant'" class="profile-dropdown-item" @click.stop="toggleDemoRole">
                    🔄 Switch back to Super Admin
                </button>
                
                <!-- If superadmin and a specific brand is selected, allow acting as brand admin -->
                <button class="profile-dropdown-item" v-if="userRole.toLowerCase() === 'superadmin' && activeShopFilter !== 'all'" @click.stop="assumeStoreAdmin">
                    👤 Act as {{ activeWorkspaceName }} Admin
                </button>
                
                <button class="profile-dropdown-item" @click.stop="openProfileModal">
                    👤 Profile Settings
                </button>
                
                <div class="profile-dropdown-divider"></div>
                <button class="profile-dropdown-item logout" @click.stop="handleLogout">
                    🚪 Log Out
                </button>
            </div>

            <!-- Footer Profile Container -->
            <div class="footer-profile" @click.stop="profileDropdownOpen = !profileDropdownOpen" style="cursor: pointer;">
                <div class="footer-profile-avatar">
                    <img v-if="userRole.toLowerCase() === 'merchant' && activeWorkspaceFavicon" :src="activeWorkspaceFavicon" style="width: 100%; height: 100%; object-fit: cover;" />
                    <img v-else-if="operatorAvatarSrc" :src="operatorAvatarSrc" style="width: 100%; height: 100%; object-fit: cover;" />
                    <div v-else class="footer-profile-avatar-placeholder">{{ operatorInitials }}</div>
                </div>
                <div class="footer-profile-meta">
                    <div class="footer-profile-name">{{ operatorName }}</div>
                    <div class="footer-profile-role">{{ operatorRole }}</div>
                </div>
                <span style="color: var(--text-muted); font-size: 0.72rem;">▼</span>
            </div>
        </aside>

        <!-- BOTTOM MOBILE NAVBAR -->
        <div class="bottom-navbar" v-if="isLoggedIn">
            <button class="bottom-nav-btn" :class="{ active: activeView === 'overview' }" @click="switchView('overview')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Dashboard</span>
            </button>
            <button class="bottom-nav-btn" :class="{ active: activeView === 'products' }" @click="switchView('products')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>Products</span>
            </button>
            <button class="bottom-nav-btn" :class="{ active: activeView === 'orders' }" @click="switchView('orders')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>Orders</span>
            </button>
            <button class="bottom-nav-btn" :class="{ active: activeView === 'brands' }" @click="switchView('brands')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <span>Channels</span>
            </button>
            <button class="bottom-nav-btn" @click="mobileSidebarOpen = !mobileSidebarOpen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <span>Menu</span>
            </button>
        </div>

        <!-- MAIN WORKSPACE -->
        <main v-if="isLoggedIn" :style="isCampaignCreatorFullscreen ? { marginLeft: 0, width: '100%' } : {}">
            <!-- Top Navigation Header -->
            <!-- Top Navigation Header -->
            <header v-if="!isCampaignCreatorFullscreen">
                <!-- TOP ROW: BREADCRUMBS & TOP NAV CONTROLS -->
                <div class="header-top-row">
                    <!-- Left: Breadcrumbs -->
                    <div class="breadcrumbs"
                        style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500; display: flex; align-items: center; gap: 8px;">
                        <button class="header-icon-btn mobile-menu-btn" @click="mobileSidebarOpen = !mobileSidebarOpen"
                            style="margin-left: -8px; display: none; background: none; border: none; cursor: pointer; color: var(--text-main);">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <span>Dashboard</span>
                        <span style="color: var(--text-muted); font-size: 0.75rem;">&gt;</span>
                        <span style="color: var(--text-main); font-weight: 600;">{{ breadcrumbLabel }}</span>
                    </div>

                    <!-- Right: Search, Notifications, Avatar -->
                    <div class="header-controls">
                        <!-- Search bar input with cmd+k -->
                        <div class="header-search-container" style="position: relative; width: 220px;">
                            <svg class="header-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2.5"
                                style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" class="header-search-input" placeholder="Search..."
                                @click="openSearchModal"
                                style="width: 100%; padding: 8px 12px 8px 36px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); font-size: 0.85rem; height: 36px; font-family: var(--font-body); color: var(--text-main);">
                            <div class="header-search-shortcut"
                                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">
                                ⌘ K</div>
                        </div>

                        <!-- Env switcher select dropdown -->
                        <select id="env-switcher" v-model="currentEnv" @change="changeEnvironment"
                            style="width: 105px; font-weight: 600; border-radius: 8px; height: 36px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-size: 0.82rem; padding: 0 8px;">
                            <option value="local">💻 Local</option>
                            <option value="dev">⚙️ Dev</option>
                            <option value="prod">🚀 Prod</option>
                        </select>

                        <!-- Alerts/Notifications icon button -->
                        <button class="header-icon-btn"
                            @click="openSystemStatusModal"
                            style="background: none; border: 1px solid var(--border); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; padding: 0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </button>

                        <!-- Inbox icon button -->
                        <button class="header-icon-btn"
                            @click="triggerUpcoming('Inbox Messages', 'User inquiry threads.')"
                            style="background: none; border: 1px solid var(--border); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; padding: 0;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z">
                                </path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </button>

                        <!-- Profile avatar picture -->
                        <div class="profile-selector-avatar"
                            style="width: 36px; height: 36px; font-size: 0.9rem; border-radius: 50%; background: #1a1d1f; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                            {{ footerLetter }}</div>
                    </div>
                </div>

                <!-- BOTTOM ROW: GREETING & PAGE ACTIONS -->
                <div class="header-bottom-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; flex-wrap: wrap; gap: 12px; flex-shrink: 0;">
                    <!-- Left: Unified Page Title & Subtitle -->
                    <div style="text-align: left;">
                        <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0;">{{ pageHeader.title }}</h2>
                        <p style="color: var(--text-muted); font-size: 0.82rem; margin: 4px 0 0 0;">{{ pageHeader.subtitle }}</p>
                    </div>

                    <!-- Right: Quick Filters & Actions -->
                    <div class="header-actions-row" style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
                        <template v-if="['overview', 'reports', 'campaigns'].includes(activeView) && currentEnv !== 'prod'">
                            <!-- Demo data mode toggle switch -->
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.82rem; font-weight: 700; height: 40px; margin-right: 8px; background: rgba(197, 160, 89, 0.05); border: 1px dashed var(--accent); padding: 0 12px; border-radius: 8px; user-select: none; white-space: nowrap; flex-shrink: 0;">
                                <input type="checkbox" v-model="showDemoData" @change="toggleDemoDataMode" style="width: 16px; height: 16px; margin: 0; cursor: pointer; flex-shrink: 0;">
                                <span style="color: var(--accent); white-space: nowrap;">⚡ Demo Data Mode</span>
                            </label>

                            <!-- Timeframe select dropdown -->
                            <select v-model="analyticsTimeframe" @change="renderAnalyticsCharts"
                                style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; outline: none; font-family: var(--font-display);">
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
     
                            <!-- Calendar Date Select -->
                            <div style="position: relative; display: flex; align-items: center;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    style="position: absolute; left: 12px; color: var(--text-muted); pointer-events: none;">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input type="date" v-model="analyticsStartDate" @change="renderAnalyticsCharts"
                                    style="padding: 8px 16px 8px 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; outline: none; font-family: var(--font-display);">
                            </div>
     
                            <!-- CSV Export button matching reference -->
                            <button class="pill-btn dark"
                                @click="exportOrdersCSV"
                                style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--primary); background: var(--primary); color: var(--bg-color); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export CSV
                            </button>
                        </template>

                        <!-- Add Product button for products -->
                        <button class="btn btn-accent" style="margin: 0; font-weight: 700; height: 40px;" v-if="activeView === 'products'" @click="$refs.productsView && $refs.productsView.openAddProductModal()">
                            ➕ Add Product
                        </button>

                        <!-- Upload button for media -->
                        <button class="btn btn-accent" style="margin: 0; font-weight: 700; height: 40px;" v-if="activeView === 'media'" @click="$refs.mediaView && $refs.mediaView.openUploadModal()">
                            📤 Upload New Asset
                        </button>

                        <!-- Spin Up New Brand Shop button for channels -->
                        <button class="btn btn-accent" style="margin: 0; font-weight: 700; height: 40px;" v-if="activeView === 'brands' && userRole.toLowerCase() === 'superadmin' && !isCreatingBrand && brandsSubView === 'list' && (!$refs.brandsView || $refs.brandsView.activeSubView === 'list')" @click="$refs.brandsView && $refs.brandsView.startBrandCreation()">
                            ➕ Spin Up New Brand Shop
                        </button>

                        <!-- Create New Campaign button for campaigns view -->
                        <button class="btn btn-accent" style="margin: 0; font-weight: 700; height: 40px;" v-if="activeView === 'campaigns'" @click="$refs.campaignsView && $refs.campaignsView.openCreateCampaignModal()">
                            ➕ Launch New Ad
                        </button>
                    </div>
                </div>
            </header>

            <div v-if="brands.length > 0 && activeView !== 'designer' && !isCampaignCreatorFullscreen && campaigns.length === 0" class="onboarding-walkthrough-bar" style="margin: 0 30px 20px 30px; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border); border-radius: 8px; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">🧭</span>
                    <div>
                        <strong style="font-size: 0.82rem; color: var(--accent); display: block; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">Brand Walkthrough Progress</strong>
                        <span style="font-size: 0.76rem; color: var(--text-muted);">Complete these 4 configuration steps to launch your store campaigns.</span>
                    </div>
                </div>
                
                <!-- Steps Indicators -->
                <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                    <!-- Step 1: Channel Setup -->
                    <div style="display: flex; align-items: center; gap: 6px; opacity: 1;">
                        <span style="background: #22c55e; color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">✓</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">1. Store Setup</span>
                    </div>

                    <!-- Line connector -->
                    <div style="width: 20px; height: 1px; background: var(--border);"></div>

                    <!-- Step 2: Brand Strategy -->
                    <div style="display: flex; align-items: center; gap: 6px;" :style="{ opacity: onboardingStep >= 2 ? 1 : 0.4 }">
                        <span v-if="onboardingStep > 2" style="background: #22c55e; color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">✓</span>
                        <span v-else-if="onboardingStep === 2" style="background: var(--accent); color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--accent);">2</span>
                        <span v-else style="background: transparent; color: var(--text-muted); width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border);">2</span>
                        <span style="font-size: 0.8rem; font-weight: 700;" :style="{ color: onboardingStep === 2 ? 'var(--accent)' : (onboardingStep > 2 ? 'var(--text-main)' : 'var(--text-muted)') }">2. Brand Strategy</span>
                    </div>

                    <!-- Line connector -->
                    <div style="width: 20px; height: 1px; background: var(--border);"></div>

                    <!-- Step 3: Catalog Setup -->
                    <div style="display: flex; align-items: center; gap: 6px;" :style="{ opacity: onboardingStep >= 3 ? 1 : 0.4 }">
                        <span v-if="onboardingStep > 3" style="background: #22c55e; color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">✓</span>
                        <span v-else-if="onboardingStep === 3" style="background: var(--accent); color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--accent);">3</span>
                        <span v-else style="background: transparent; color: var(--text-muted); width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border);">3</span>
                        <span style="font-size: 0.8rem; font-weight: 700;" :style="{ color: onboardingStep === 3 ? 'var(--accent)' : (onboardingStep > 3 ? 'var(--text-main)' : 'var(--text-muted)') }">3. Import Catalog</span>
                    </div>

                    <!-- Line connector -->
                    <div style="width: 20px; height: 1px; background: var(--border);"></div>

                    <!-- Step 4: Ad Studio Campaign -->
                    <div style="display: flex; align-items: center; gap: 6px;" :style="{ opacity: onboardingStep >= 4 ? 1 : 0.4 }">
                        <span v-if="onboardingStep > 4" style="background: #22c55e; color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold;">✓</span>
                        <span v-else-if="onboardingStep === 4" style="background: var(--accent); color: #0d0e12; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--accent);">4</span>
                        <span v-else style="background: transparent; color: var(--text-muted); width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; border: 1px solid var(--border);">4</span>
                        <span style="font-size: 0.8rem; font-weight: 700;" :style="{ color: onboardingStep === 4 ? 'var(--accent)' : (onboardingStep > 4 ? 'var(--text-main)' : 'var(--text-muted)') }">4. Launch Ads</span>
                    </div>
                </div>
                
                <!-- Action Guidance Tip Button -->
                <div style="flex-shrink: 0;">
                    <button v-if="!isOnboardingStepActiveView" type="button" class="btn btn-accent" style="margin: 0; font-size: 0.75rem; padding: 4px 10px; height: 28px; font-weight: bold;" @click="goToCurrentOnboardingStep">
                        👉 Proceed to Step {{ onboardingStep }}
                    </button>
                    <button v-else type="button" class="btn btn-secondary" style="margin: 0; font-size: 0.75rem; padding: 4px 10px; height: 28px; font-weight: bold; border: 1px dashed var(--accent); background: rgba(197, 160, 89, 0.1); color: var(--accent); cursor: default;" @click.prevent>
                        🎯 You are on Step {{ onboardingStep }}: {{ onboardingStepActionLabel }}
                    </button>
                </div>
            </div>

            <!-- VIEW COMPONENTS -->
            <OverviewView ref="overviewView" />
            <BrandsView ref="brandsView" />
            <ProductsView ref="productsView" />
            <OrdersView ref="ordersView" />
            <WarehouseSimView ref="warehouseSimView" />
            <SettingsView ref="settingsView" />
            <AiLearningCenterView ref="aiLearningCenterView" :app="this" />
            <AiAnalyticsView ref="aiAnalyticsView" />
            <BrandCenterView ref="brandCenterView" />
            <HelpView ref="helpView" />
            <CustomersView ref="customersView" />
            <ReportsView ref="reportsView" />
            <MessagesView ref="messagesView" />
            <TeamPerformanceView ref="teamPerformanceView" />
            <CampaignsView ref="campaignsView" @toggle-fullscreen-creator="isCampaignCreatorFullscreen = $event" />
            <RolesPermissionsView ref="rolesPermissionsView" />
            <BillingSubscriptionView ref="billingSubscriptionView" />
            <CustomerSupportView ref="customerSupportView" />
            <CouponsView ref="couponsView" />
            <MediaView ref="mediaView" />

            <!-- NOT-FOUND VIEW -->
            <div class="admin-view" :class="{ active: activeView === 'not-found' }" style="justify-content: center; align-items: center; min-height: 60vh; text-align: center;">
                <div class="panel" style="max-width: 480px; padding: 48px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-panel); display: flex; flex-direction: column; align-items: center; gap: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div style="font-size: 5rem; line-height: 1; font-weight: 800; background: linear-gradient(135deg, var(--accent) 0%, #d4b26f 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">404</div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin: 0; font-family: 'Outfit', sans-serif;">Page Not Found</h2>
                    <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5; margin: 0; font-family: 'Outfit', sans-serif;">
                        The page you are looking for doesn't exist or has been moved. Use the sidebar menu to navigate.
                    </p>
                    <button @click="switchView('overview')" class="btn btn-accent" style="margin-top: 8px; font-weight: 700; padding: 10px 24px;">
                        Go Back to Overview
                    </button>
                </div>
            </div>
        </main>

        <!-- LIVE SEARCH OVERLAY MODAL (⌘ K) -->
        <div class="search-modal" v-if="searchModalOpen" @click.self="closeSearchModal">
            <div class="search-modal-container" @click.stop>
                <div class="search-modal-input-row">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        style="color: var(--text-muted); margin-right: 12px;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" v-model="searchQuery" class="search-modal-input"
                        placeholder="Search active shops, products, transactions..." ref="searchInput">
                    <span
                        style="font-size: 0.72rem; color: var(--text-muted); background: #fafbfc; border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; font-weight: 600;">ESC</span>
                </div>
                <div class="search-modal-results" style="max-height: 450px; overflow-y: auto;">
                    <div v-if="!searchQuery.trim()"
                        style="text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 30px 10px;">
                        Type to search catalog items...</div>

                    <div v-if="searchQuery.trim()">
                        <!-- Navigation / Quick Actions -->
                        <div v-if="matchingSearchActions.length > 0">
                            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 8px 0 6px 0;">
                                Quick Actions</div>
                            <div v-for="act in matchingSearchActions" :key="act.name" class="search-item"
                                @click="selectSearchAction(act.view)" style="margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(197, 160, 89, 0.15); border: 1px solid rgba(197, 160, 89, 0.25); flex-shrink: 0;">
                                        <span style="font-size: 0.95rem;">⚡</span>
                                    </div>
                                    <span style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">{{ act.name }}</span>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--accent);">Jump to Section ↗</span>
                            </div>
                        </div>

                        <!-- Brand Shops -->
                        <div v-if="matchingSearchShops.length > 0">
                            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 16px 0 6px 0;">
                                Brand Shops</div>
                            <div v-for="shop in matchingSearchShops" :key="shop.id" class="search-item"
                                @click="selectSearchShop(shop.id)" style="margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #ffffff; border: 1px solid var(--border); flex-shrink: 0; padding: 4px;">
                                        <img v-if="shop.favicon || shop.logo" :src="shop.favicon || shop.logo" style="width: 100%; height: 100%; object-fit: contain;" />
                                        <span v-else style="font-size: 0.95rem;">🏪</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">{{ shop.name }}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ shop.subdomain }}</span>
                                    </div>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--accent);">Integrations Settings ↗</span>
                            </div>
                        </div>

                        <!-- Catalog / Products -->
                        <div v-if="matchingSearchProducts.length > 0">
                            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 16px 0 6px 0;">
                                Products Catalog</div>
                            <div v-for="prod in matchingSearchProducts" :key="prod.id" class="search-item"
                                @click="selectSearchProduct(prod.id)" style="margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--workspace-bg); border: 1px solid var(--border); flex-shrink: 0;">
                                        <img v-if="prod.image" :src="prod.image" style="width: 100%; height: 100%; object-fit: cover;" />
                                        <span v-else style="font-size: 0.95rem;">📦</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-weight: 600; color: var(--text-main); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ prod.title }}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">ID: {{ prod.id }} • <strong style="color: var(--accent);">{{ getBrandName(prod.brand_id) }}</strong></span>
                                    </div>
                                </div>
                                <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">€{{ parseFloat(prod.price).toFixed(2) }}</span>
                            </div>
                        </div>

                        <!-- Transactions / Orders -->
                        <div v-if="matchingSearchOrders.length > 0">
                            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 16px 0 6px 0;">
                                Transactions / Orders</div>
                            <div v-for="ord in matchingSearchOrders" :key="ord.id" class="search-item"
                                @click="selectSearchOrder(ord.id)" style="margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); flex-shrink: 0;">
                                        <span style="font-size: 0.95rem;">💳</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-weight: 600; color: var(--text-main); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ ord.id }}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted);">{{ ord.customer_name }} • <strong style="color: var(--accent);">{{ getBrandName(ord.brand_id) }}</strong></span>
                                    </div>
                                </div>
                                <span class="status-badge status-success" style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">€{{ parseFloat(ord.total).toFixed(2) }}</span>
                            </div>
                        </div>

                        <!-- Customers -->
                        <div v-if="matchingSearchCustomers.length > 0">
                            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 16px 0 6px 0;">
                                Customers</div>
                            <div v-for="cust in matchingSearchCustomers" :key="cust.email" class="search-item"
                                @click="selectSearchCustomer(cust.email)" style="margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.25); flex-shrink: 0;">
                                        <span style="font-weight: 700; color: #3b82f6; font-size: 0.85rem;">{{ cust.name ? cust.name.charAt(0).toUpperCase() : '👤' }}</span>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-weight: 600; color: var(--text-main); font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ cust.name }}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ cust.email }} • <strong style="color: var(--accent);">{{ getBrandName(cust.brand_id) }}</strong></span>
                                    </div>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">{{ cust.ordersCount }} orders</span>
                            </div>
                        </div>

                        <!-- Empty state -->
                        <div v-if="matchingSearchShops.length === 0 && matchingSearchOrders.length === 0 && matchingSearchProducts.length === 0 && matchingSearchCustomers.length === 0 && matchingSearchActions.length === 0"
                            style="text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 30px 10px;">
                            No matching results found in active workspace catalog.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- UPCOMING ROADMAPPED BETA FEATURES OVERLAY MODAL -->
        <div class="upcoming-modal" v-if="upcomingModal.open" @click.self="closeUpcomingModal">
            <div class="upcoming-card" @click.stop>
                <div
                    style="background: rgba(0, 0, 0, 0.03); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: var(--text-main);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <h3
                    style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 10px;">
                    {{ upcomingModal.title }}</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 30px;">{{
                    upcomingModal.description }}</p>
                <button class="btn" style="width: 100%;" @click="closeUpcomingModal">Return to Dashboard</button>
            </div>
        </div>

        <!-- SYSTEM HEALTH & PLATFORM STATUS AUDITS CONSOLE MODAL -->
        <div class="upcoming-modal" v-if="systemStatusModalOpen" @click.self="closeSystemStatusModal">
            <div class="upcoming-card" @click.stop style="max-width: 650px; width: 100%; text-align: left; padding: 24px; max-height: 90vh; overflow-y: auto; border-radius: 12px; background: var(--card-bg); border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
                        💻 System Diagnostics & Audits
                    </h3>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-secondary" @click="loadSystemStatus" :disabled="systemStatusLoading" style="padding: 4px 10px; font-size: 0.75rem; height: auto;">
                            {{ systemStatusLoading ? 'Auditing...' : '🔄 Refresh' }}
                        </button>
                        <button class="btn btn-secondary" @click="closeSystemStatusModal" style="padding: 4px 10px; font-size: 0.75rem; height: auto;">×</button>
                    </div>
                </div>

                <div v-if="systemStatusLoading && !systemStatus" style="padding: 40px 0; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    Running platform diagnostics check...
                </div>

                <div v-else-if="systemStatus">
                    <!-- Status Cards Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <!-- DB Status -->
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: bold; color: var(--text-muted);">Database Link</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span :style="{ background: systemStatus.db.status === 'healthy' ? '#10b981' : '#ef4444' }" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                                    {{ systemStatus.db.status === 'healthy' ? 'Connected' : 'Offline' }}
                                </span>
                            </div>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">Ping: {{ systemStatus.db.ping }}ms</span>
                        </div>

                        <!-- Shopify Connection -->
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: bold; color: var(--text-muted);">Shopify Sync</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span :style="{ background: systemStatus.integrations.shopify !== 'disabled' ? '#10b981' : '#f59e0b' }" style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                                    {{ systemStatus.integrations.shopify === 'connected' ? 'API Active' : (systemStatus.integrations.shopify === 'public_scrape' ? 'Scraper Mode' : 'Inactive') }}
                                </span>
                            </div>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">Mode: {{ systemStatus.integrations.shopify }}</span>
                        </div>

                        <!-- DNS Resolution -->
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: bold; color: var(--text-muted);">DNS resolution</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="background: #10b981; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Verified</span>
                            </div>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">SSL status: active</span>
                        </div>
                    </div>

                    <!-- System Memory Diagnostics -->
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">RAM Allocation & Heap Usage</span>
                            <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent);">{{ systemStatus.system.memory.percent }}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden; margin-bottom: 8px;">
                            <div :style="{ width: systemStatus.system.memory.percent + '%' }" style="height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted);">
                            <span>Used: {{ systemStatus.system.memory.used }}</span>
                            <span>Total System: {{ systemStatus.system.memory.total }}</span>
                        </div>
                    </div>

                    <!-- Platform Audits Log Console -->
                    <div>
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin: 0 0 10px 0;">📋 Platform Status Audits Timeline</h4>
                        <div style="background: #0d0d0d; border: 1px solid var(--border); border-radius: 8px; height: 250px; overflow-y: auto; font-family: monospace; font-size: 0.78rem; padding: 12px; display: flex; flex-direction: column; gap: 8px; color: #a0a0a0;">
                            <div v-if="systemStatus.logs.length === 0" style="padding: 20px; text-align: center; color: var(--text-muted);">No log records populated yet.</div>
                            <div v-for="(log, idx) in systemStatus.logs" :key="idx" style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <span style="color: var(--accent); font-weight: bold;">[{{ log.action }}]</span>
                                    <span style="font-size: 0.7rem; color: var(--text-muted);">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
                                </div>
                                <div style="display: flex; gap: 6px; align-items: flex-start;">
                                    <span :style="{ color: log.status === 'success' ? '#10b981' : '#ef4444' }">●</span>
                                    <span style="word-break: break-all;">{{ log.details }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 24px; text-align: right;">
                    <button class="btn btn-secondary" @click="closeSystemStatusModal" style="padding: 8px 16px;">Close Diagnostics</button>
                </div>
            </div>
        </div>

        <!-- ADD TRANSACTION MODAL -->
        <div class="upcoming-modal" v-if="newTransactionModal.open" @click.self="closeNewTransactionModal">
            <div class="upcoming-card" @click.stop style="max-width: 500px; width: 100%; text-align: left; padding: 24px;">
                <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <span>Add New Transaction</span>
                    <span @click="closeNewTransactionModal" style="cursor: pointer; font-size: 1.1rem; color: var(--text-muted);">&times;</span>
                </h3>
                
                <form @submit.prevent="submitNewTransaction">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Customer Name</label>
                            <input type="text" v-model="newTransactionModal.customer_name" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Customer Email</label>
                            <input type="email" v-model="newTransactionModal.customer_email" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Select Shop/Brand</label>
                            <select v-model="newTransactionModal.brand_id" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; cursor: pointer;">
                                <option v-for="brand in activeBrands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Select Product</label>
                            <select v-model="newTransactionModal.product_id" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; cursor: pointer;">
                                <option v-for="prod in products" :key="prod.id" :value="prod.id">{{ prod.title }} (€{{ parseFloat(prod.price).toFixed(2) }})</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Quantity</label>
                            <input type="number" v-model.number="newTransactionModal.quantity" min="1" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem;">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 6px;">Status</label>
                            <select v-model="newTransactionModal.status" required style="width: 100%; height: 38px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; cursor: pointer;">
                                <option value="paid">Paid (Success)</option>
                                <option value="pending_payment">Pending</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2; margin-top: 16px;">
                            <button type="submit" class="btn" style="width: 100%; height: 42px; font-weight: 700;">Record Transaction</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Toast message notification -->
        <div class="toast" :class="{ show: toastMessage }">
            <span style="color: var(--text-main); font-weight: bold; font-size: 1.1rem;">✔</span>
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">{{ toastMessage }}</span>
        </div>

        <!-- User Profile Settings Modal -->
        <div v-if="profileModalOpen" class="modal-overlay" @click.self="profileModalOpen = false" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(10px);">
            <div class="panel" style="width: 100%; max-width: 450px; background: var(--panel-bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); overflow: hidden; display: flex; flex-direction: column;">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid var(--border);">
                    <h3 class="panel-title" style="margin: 0; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        👤 User Profile Settings
                    </h3>
                    <button @click="profileModalOpen = false" style="background: none; border: none; color: var(--text-muted); font-size: 1.25rem; cursor: pointer; transition: color 0.2s; padding: 0;">&times;</button>
                </div>
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                    <!-- User Details -->
                    <div style="display: flex; align-items: center; gap: 15px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 15px; border-radius: 8px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; text-transform: uppercase;">
                            {{ operatorInitials }}
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">{{ operatorName }}</div>
                            <div style="font-size: 0.76rem; color: var(--text-muted); font-family: monospace;">{{ loginEmail }}</div>
                        </div>
                    </div>

                    <!-- Details Fields -->
                    <div style="text-align: left;">
                        <label style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Active Account Role</label>
                        <input type="text" :value="operatorRole" disabled style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text-muted); font-size: 0.85rem; padding: 0 10px; box-sizing: border-box; cursor: not-allowed;" />
                    </div>

                    <form @submit.prevent="updateUserProfile" style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
                        <!-- First & Last Name Fields -->
                        <div style="display: flex; gap: 15px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">First Name</label>
                                <input type="text" v-model="operatorFirstName" required style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 10px; box-sizing: border-box;" />
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Last Name</label>
                                <input type="text" v-model="operatorLastName" required style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 10px; box-sizing: border-box;" />
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">New Password</label>
                            <input type="password" v-model="profilePassword" placeholder="Enter new password (min 6 chars)" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 10px; box-sizing: border-box;" />
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Confirm New Password</label>
                            <input type="password" v-model="profilePasswordConfirm" placeholder="Confirm new password" style="width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--border); background: var(--workspace-bg); color: var(--text-main); font-size: 0.85rem; padding: 0 10px; box-sizing: border-box;" />
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" @click="profileModalOpen = false" class="btn btn-secondary" style="height: 38px; padding: 0 15px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; background: transparent; border: 1px solid var(--border); color: var(--text-main); cursor: pointer;">Cancel</button>
                            <button type="submit" class="btn btn-accent" style="height: 38px; padding: 0 20px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; background: var(--accent); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                💾 Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>        
        <!-- Unsaved Changes Alert Dialog Overlay -->
        <div v-if="showUnsavedChangesModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 11000; backdrop-filter: blur(10px);">
            <div class="panel" style="width: 100%; max-width: 420px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); overflow: hidden; display: flex; flex-direction: column;">
                <div class="panel-header" style="padding: 15px 20px; border-bottom: 1px solid var(--border); text-align: left;">
                    <h3 class="panel-title" style="margin: 0; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                        ⚠️ Unsaved Changes
                    </h3>
                </div>
                <div style="padding: 20px; text-align: left; display: flex; flex-direction: column; gap: 12px;">
                    <p style="margin: 0; font-size: 0.88rem; color: var(--text-main); line-height: 1.5;">
                        You have modified parameters in this view. Leaving this form now will discard your unsaved configurations.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                        <button @click="saveAndLeave" class="btn btn-accent" style="height: 38px; width: 100%; font-weight: 700; background: var(--accent); color: #fff; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0;">
                            💾 Save & Continue
                        </button>
                        <button @click="discardAndLeave" class="btn btn-secondary" style="height: 38px; width: 100%; font-weight: 700; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; cursor: pointer; margin: 0;">
                            🗑️ Discard Changes & Leave
                        </button>
                        <button @click="showUnsavedChangesModal = false" class="btn" style="height: 38px; width: 100%; font-weight: 700; background: transparent; color: var(--text-main); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; margin: 0;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
</template><script>
import { nextTick } from 'vue';
import operatorAvatar from './assets/operator_avatar.png';
import { Chart, registerables } from 'chart.js';

import OverviewView from './components/OverviewView.vue';
import BrandsView from './components/BrandsView.vue';
import CouponsView from './components/CouponsView.vue';
import ProductsView from './components/ProductsView.vue';
import OrdersView from './components/OrdersView.vue';
import WarehouseSimView from './components/WarehouseSimView.vue';
import SettingsView from './components/SettingsView.vue';
import AiAnalyticsView from './components/AiAnalyticsView.vue';
import BrandCenterView from './components/BrandCenterView.vue';
import HelpView from './components/HelpView.vue';
import CustomersView from './components/CustomersView.vue';
import ReportsView from './components/ReportsView.vue';
import MessagesView from './components/MessagesView.vue';
import TeamPerformanceView from './components/TeamPerformanceView.vue';
import CampaignsView from './components/CampaignsView.vue';
import RolesPermissionsView from './components/RolesPermissionsView.vue';
import BillingSubscriptionView from './components/BillingSubscriptionView.vue';
import CustomerSupportView from './components/CustomerSupportView.vue';
import MediaView from './components/MediaView.vue';
import AiLearningCenterView from './components/AiLearningCenterView.vue';
import AiEstimateBadge from './components/AiEstimateBadge.vue';

Chart.register(...registerables);



export default {
            components: {
                OverviewView,
                BrandsView,
                ProductsView,
                OrdersView,
                WarehouseSimView,
                SettingsView,
                AiAnalyticsView,
                BrandCenterView,
                HelpView,
                CustomersView,
                ReportsView,
                MessagesView,
                TeamPerformanceView,
                CampaignsView,
                RolesPermissionsView,
                BillingSubscriptionView,
                CustomerSupportView,
                CouponsView,
                MediaView,
                AiLearningCenterView,
                AiEstimateBadge
            },
            provide() {
                return {
                    app: this
                };
            },
            data() {
                return {
                    operatorAvatarSrc: localStorage.getItem('sc_operator_avatar') || operatorAvatar,
                    operatorFirstName: localStorage.getItem('sc_operator_first_name') || 'Salung',
                    operatorLastName: localStorage.getItem('sc_operator_last_name') || 'Prastyo',
                    profileDropdownOpen: false,
                    profileModalOpen: false,
                    profilePassword: '',
                    profilePasswordConfirm: '',
                    appTheme: localStorage.getItem('sc_admin_theme') || 'system',
                    activeView: 'overview',
                    isCampaignCreatorFullscreen: false,
                    requestedInitialView: 'overview',
                    currentEnv: 'local',
                    activeShopFilter: 'all',
                    globalProtocolInterval: null,
                    originalSettingsBrand: null,
                    showUnsavedChangesModal: false,
                    pendingNavigationTargetView: '',
                    workspaceDropdownOpen: false,
                    productsSearchQuery: '',
                    customerSearchQuery: '',
                    ordersSearchQuery: '',
                    analyticsTimeframe: 'Monthly',
                    salesChartType: 'bar',
                    funnelChartType: 'bar',
                    analyticsStartDate: '',
                    showDemoData: false,
                    aiTicker: {
                        active: false,
                        tokens: 0,
                        cost: 0.0,
                        intervalId: null
                    },
                    trafficStats: [],
                    newTransactionModal: {
                        open: false,
                        brand_id: '',
                        customer_name: '',
                        customer_email: '',
                        product_id: '',
                        quantity: 1,
                        status: 'paid'
                    },

                    // Datasets
                    brands: [],
                    brandsLoaded: false,
                    tierFeaturesList: [],
                    orders: [],
                    products: [],
                    campaigns: [],
                    activityLogs: [],

                    // Auth state
                    isLoggedIn: false,
                    authMode: 'login',
                    loginEmail: '',
                    loginPassword: '',
                    loginError: '',
                    userRole: 'Superadmin',
                    userEmail: '',

                    // Forms
                    newBrand: {
                        id: '',
                        name: '',
                        subdomain: '',
                        contact_email: '',
                        primary_color: '#111111',
                        secondary_color: '#767676',
                        bg_color: '#ffffff',
                        text_color: '#111111',
                        button_radius: '4px',
                        button_text_color: '#ffffff',
                        header_bg_color: '#ffffff',
                        theme_settings: '',
                        platform: 'shopify',
                        shopify_shop_name: '',
                        shopify_access_token: '',
                        woocommerce_shop_url: '',
                        woocommerce_consumer_key: '',
                        woocommerce_consumer_secret: '',
                        stripe_secret_key: '',
                        stripe_webhook_secret: '',
                        custom_domain: '',
                        logo: '',
                        favicon: '',
                        font_family: 'Outfit',
                        languages: ['en'],
                        ai_tier: 'professional',
                        price_markup: 0.00,
                        billing_type: '',
                        platform_take_rate: 0.15,
                        stripe_connect_account_id: '',
                        subscription_billing_method: '',
                        stripe_customer_id: null
                    },
                    newProduct: {
                        brand_id: '',
                        title: '',
                        price: 132.00,
                        tag: '',
                        image: '',
                        original_link: '',
                        description: '',
                        long_description: '',
                        features: '',
                        compatibility: '',
                        sku: '',
                        external_id: '',
                        translations: {}
                    },
                    settingsBrand: {
                        id: '',
                        name: '',
                        subdomain: '',
                        contact_email: '',
                        primary_color: '#111111',
                        secondary_color: '#767676',
                        bg_color: '#ffffff',
                        text_color: '#111111',
                        button_radius: '4px',
                        button_text_color: '#ffffff',
                        header_bg_color: '#ffffff',
                        theme_settings: '',
                        shopify_shop_name: '',
                        shopify_access_token: '',
                        stripe_secret_key: '',
                        stripe_webhook_secret: '',
                        custom_domain: '',
                        logo: '',
                        favicon: '',
                        stripe_enabled: false,
                        languages: ['en'],
                        billing_type: '',
                        platform_take_rate: 0.15,
                        stripe_connect_account_id: '',
                        subscription_billing_method: '',
                        stripe_customer_id: null
                    },

                    // Shopify Importer
                    shopifyImportBrandId: '',
                    shopifyProducts: [],
                    shopifyScanStatus: '',

                    // Operator Users Roster
                    users: [],

                    // Warehouse Simulator Launcher select
                    simBrandId: '',
                    previewActiveBrandId: '',

                    // Search modal state (⌘ K)
                    searchModalOpen: false,
                    searchQuery: '',

                    // Upcoming features popup roadblock
                    upcomingModal: {
                        open: false,
                        title: '',
                        description: ''
                    },
                    systemStatusModalOpen: false,
                    systemStatusLoading: false,
                    systemStatus: null,

                    // Sidebar drawer responsive state
                    mobileSidebarOpen: false,

                    // UI Toast Notification
                    toastMessage: '',

                    // Loading progress
                    uploadingMedia: false,
                    // Mirrored state variables for child BrandsView layout state
                    brandsSubView: 'list',
                    isCreatingBrand: false,
                    helpManualHtml: 'Loading onboarding guidelines...'
                };
            },
            computed: {
                adminToken() {
                    return localStorage.getItem('sc_admin_token');
                },
                isOnboardingStepActiveView() {
                    const step = this.onboardingStep;
                    if (step === 1 && this.activeView === 'brands') return true;
                    if (step === 2 && this.activeView === 'brand-center') return true;
                    if (step === 3 && this.activeView === 'products') return true;
                    if (step === 4 && this.activeView === 'campaigns') return true;
                    return false;
                },
                onboardingStepActionLabel() {
                    const step = this.onboardingStep;
                    if (step === 1) return 'Onboard Storefront';
                    if (step === 2) return 'Configure Strategy Playbook';
                    if (step === 3) return 'Add / Sync Products';
                    if (step === 4) return 'Launch Campaign';
                    return '';
                },
                needsOnboarding() {
                    return this.isLoggedIn && 
                           this.userRole.toLowerCase() === 'merchant' && 
                           (this.brands.length === 0 || this.brands.some(b => b.status === 'draft'));
                },
                isBrandStrategyConfigured() {
                    if (this.activeShopFilter === 'all' || !this.activeShopFilter) return false;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    if (!brand) return false;
                    if (brand.marketing_protocol && brand.marketing_protocol.trim()) return true;
                    if (brand.brand_canvas) {
                        try {
                            const canvasObj = typeof brand.brand_canvas === 'string'
                                ? JSON.parse(brand.brand_canvas)
                                : brand.brand_canvas;
                            if (canvasObj && (
                                (canvasObj.brand_voice && canvasObj.brand_voice.length > 50) ||
                                (canvasObj.product_architecture && canvasObj.product_architecture.length > 50) ||
                                (canvasObj.controlled_vocabulary && ((canvasObj.controlled_vocabulary.approved && canvasObj.controlled_vocabulary.approved.length > 0) || (canvasObj.controlled_vocabulary.banned && canvasObj.controlled_vocabulary.banned.length > 0))) ||
                                (canvasObj.personas && canvasObj.personas.length > 0)
                            )) {
                                return true;
                            }
                        } catch (e) {}
                    }
                    return false;
                },
                onboardingStep() {
                    if (this.brands.length === 0) return 1;
                    if (!this.isBrandStrategyConfigured) return 2;
                    const activeBrandProducts = this.products.filter(p => p.brand_id === this.activeShopFilter);
                    if (activeBrandProducts.length === 0) return 3;
                    return 4;
                },
                operatorRole() {
                    if (!this.isLoggedIn) return 'Guest';
                    if (this.userRole && this.userRole.toLowerCase() === 'superadmin') {
                        return 'Super Admin';
                    }
                    if (this.userRole && this.userRole.toLowerCase() === 'merchant') {
                        return 'Merchant';
                    }
                    return this.userRole || 'Sales Operator';
                },
                pageHeader() {
                    switch (this.activeView) {
                        case 'overview':
                            return { title: 'Overview Dashboard', subtitle: 'Monitor store performance metrics, revenues, and recent transactions' };
                        case 'brand-center':
                            return { title: 'Brand Identity Center', subtitle: 'Define voice guidelines, personas, style variables, and strategy playbooks' };
                        case 'campaigns':
                            return { title: 'Smart Ad Studio', subtitle: 'Orchestrate performance ad campaigns, budget schedules, and copies' };
                        case 'brands':
                            return { title: 'Store Channels', subtitle: 'Manage store connections, checkout redirects, and brand customizers' };
                        case 'products':
                            return { title: 'Product Catalog Management', subtitle: 'Manage item statuses, retail pricing, and sync API products' };
                        case 'orders':
                            return { title: 'Recent Transactions', subtitle: 'Audit log of customer purchases, order totals, and fulfillment statuses' };
                        case 'warehouse-sim':
                            return { title: 'Fulfillment Warehouse Simulator', subtitle: 'Onboarded brand store Shopify simulated fulfillment warehouse' };
                        case 'settings':
                            return { title: 'Shop Integrations & Configurations', subtitle: 'Manage API credentials, domain routing, and master theme variables' };
                        case 'ai-analytics':
                            return { title: 'AI Usage & Cost Analytics', subtitle: 'Track real-time token usage, API call frequencies, and platform costs' };
                        case 'help':
                            return { title: 'Help Center & Knowledge Base', subtitle: 'Search integration manuals, WooCommerce guides, and FAQs' };
                        case 'customers':
                            return { title: 'Customer Directory', subtitle: 'Compiled database of shoppers, languages, and lifetime value tracking' };
                        case 'reports':
                            return { title: 'Reports & Analytics', subtitle: 'Analyze top selling products, sales conversion rates, and revenue performance' };
                        case 'roles-permissions':
                            return { title: 'Roles & Permissions', subtitle: 'Manage platform operators, access scopes, and provision managers' };
                        case 'billing-subscription':
                            return { title: 'Billing & Subscription', subtitle: 'Manage active subscription plans, API usage, and download Stripe invoices' };
                        case 'coupons':
                            return { title: 'Coupons & UTM Campaign Analytics', subtitle: 'Manage UTM campaign trackers, automated post-delivery referrals, and coupon registries' };
                        case 'customer-support':
                            return { title: 'Customer Support', subtitle: 'Direct ticket inbox, customer inquiries, and support integrations' };
                        case 'media':
                            return { title: 'Media Assets Library', subtitle: 'Manage and organize media assets, store graphics, and marketing images' };
                        default:
                            return { title: 'Dashboard Workspace', subtitle: 'Manage store configurations and details' };
                    }
                },
                baseBrandDomain() {
                    const hostname = window.location.hostname;
                    if (hostname.includes('dev-dash.') || hostname.includes('dash.dev.')) {
                        return 'dev.stricktlycoffee.be';
                    }
                    if (hostname.includes('dash.')) {
                        return 'stricktlycoffee.be';
                    }
                    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
                        return 'stricktlycoffee.local';
                    }
                    return hostname.replace('dash.dev.', 'dev.').replace('dev-dash.', 'dev.').replace('dash.', '');
                },
                activeBrands() {
                    return (this.brands || []).filter(b => b.status !== 'draft');
                },
                isStrategyGenerating() {
                    if (this.activeShopFilter === 'all' || !this.activeShopFilter) return false;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.protocol_status === 'generating' : false;
                },
                activeWorkspaceLetter() {
                    if (this.activeShopFilter === 'all') return 'S';
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.name.charAt(0).toUpperCase() : 'S';
                },
                activeWorkspaceFavicon() {
                    if (this.activeShopFilter === 'all') return null;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.favicon : null;
                },
                activeWorkspaceTier() {
                    if (this.activeShopFilter === 'all') return null;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? (brand.ai_tier || 'professional') : null;
                },
                activeWorkspaceFreeTier() {
                    if (this.activeShopFilter === 'all') return false;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? !!brand.ai_free_tier : false;
                },
                activeWorkspaceName() {
                    if (this.activeShopFilter === 'all') return 'Stricktly Coffee';
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.name : 'Stricktly Coffee';
                },
                activeWorkspaceRole() {
                    if (this.activeShopFilter === 'all') {
                        return this.currentEnv === 'prod' ? '🚀 Production Stack' :
                            this.currentEnv === 'dev' ? '⚙️ Dev Stack' : '💻 Local Dev';
                    }
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? this.getBrandSubdomain(brand) : 'Custom Workspace';
                },
                filteredProducts() {
                    if (!Array.isArray(this.products)) return [];
                    if (this.activeShopFilter === 'all') return this.products;
                    return this.products.filter(p => p && p.brand_id === this.activeShopFilter);
                },
                searchedProducts() {
                    if (!this.filteredProducts) return [];
                    const q = this.productsSearchQuery.trim().toLowerCase();
                    let prods = this.filteredProducts;
                    if (!q) return prods;
                    return prods.filter(p => {
                        const title = p.title ? p.title.toLowerCase() : '';
                        const desc = p.description ? p.description.toLowerCase() : '';
                        const brandId = p.brand_id ? p.brand_id.toLowerCase() : '';
                        return title.includes(q) || desc.includes(q) || brandId.includes(q);
                    });
                },
                customers() {
                    const customerMap = {};
                    this.orders.forEach(o => {
                        const email = o.customer_email ? o.customer_email.trim().toLowerCase() : '';
                        if (!email) return;

                        if (!customerMap[email]) {
                            customerMap[email] = {
                                email: email,
                                name: o.customer_name || 'Anonymous Customer',
                                brand_id: o.brand_id,
                                ordersCount: 0,
                                totalSpent: 0,
                                lastOrderDate: o.created_at,
                                attribution_channel: o.attribution_channel || 'Direct',
                                language: o.language || 'en'
                            };
                        }

                        customerMap[email].ordersCount += 1;
                        customerMap[email].totalSpent += parseFloat(o.total || 0);
                        if (new Date(o.created_at) > new Date(customerMap[email].lastOrderDate)) {
                            customerMap[email].lastOrderDate = o.created_at;
                        }
                    });

                    let list = Object.values(customerMap);
                    
                    // Filter by shop context
                    if (this.activeShopFilter !== 'all') {
                        list = list.filter(c => c.brand_id === this.activeShopFilter);
                    }
                    
                    return list;
                },
                searchedCustomers() {
                    const q = this.customerSearchQuery.trim().toLowerCase();
                    const list = this.customers;
                    if (!q) return list;
                    return list.filter(c => 
                        c.name.toLowerCase().includes(q) || 
                        c.email.toLowerCase().includes(q)
                    );
                },
                previewIframeSrc() {
                    if (!this.previewActiveBrandId) return '';
                    const brand = this.brands.find(b => b.id === this.previewActiveBrandId);
                    if (!brand) return '';
                    if (this.currentEnv === 'local') {
                        return `/store/${this.previewActiveBrandId}`;
                    } else {
                        const domain = this.getBrandSubdomain(brand);
                        return `https://${domain}`;
                    }
                },
                envConfigs() {
                    return {
                        local: 'http://localhost:3000',
                        dev: 'https://api.dev.stricktlycoffee.be',
                        prod: 'https://api.stricktlycoffee.be'
                    };
                },
                apiBaseUrl() {
                    return this.envConfigs[this.currentEnv];
                },
                envLabel() {
                    if (this.currentEnv === 'prod') return 'Production Stack';
                    if (this.currentEnv === 'dev') return 'Remote Dev';
                    return 'Local Workspace';
                },
                footerUsername() {
                    const email = localStorage.getItem('sc_admin_email') || 'sc@davidblaesing.com';
                    return email.split('@')[0];
                },
                footerLetter() {
                    return this.footerUsername.charAt(0).toUpperCase();
                },
                welcomeName() {
                    const name = this.footerUsername;
                    return name.charAt(0).toUpperCase() + name.slice(1);
                },
                breadcrumbLabel() {
                    if (this.activeView === 'overview') return 'Overview';
                    if (this.activeView === 'warehouse-sim') return 'Warehouse Sim';
                    if (this.activeView === 'customers') return 'Customer Directory';
                    if (this.activeView === 'reports') return 'Reports & Analytics';
                    if (this.activeView === 'messages') return 'Messages & Activity Logs';
                    if (this.activeView === 'team-performance') return 'Team Performance';
                    if (this.activeView === 'campaigns') return 'Smart Ad Studio';
                    if (this.activeView === 'learning') return 'AI Learning Center';
                    if (this.activeView === 'roles-permissions') return 'Roles & Permissions';
                    if (this.activeView === 'billing-subscription') return 'Billing & Subscriptions';
                    if (this.activeView === 'customer-support') return 'Customer Support';
                    if (this.activeView === 'media') return 'Media Library';
                    return this.activeView.charAt(0).toUpperCase() + this.activeView.slice(1);
                },
                activeWorkspaceRoleLabel() {
                    if (this.activeShopFilter === 'all') {
                        return this.userRole.toLowerCase() === 'superadmin' ? 'Agency' : 'Merchant';
                    }
                    return 'Brand';
                },
                // Filtering transactions database
                filteredOrders() {
                    let list = this.orders;
                    if (this.activeShopFilter !== 'all') {
                        list = list.filter(o => o.brand_id === this.activeShopFilter);
                    }
                    if (this.analyticsStartDate) {
                        const limitDate = new Date(this.analyticsStartDate);
                        limitDate.setHours(23, 59, 59, 999);
                        list = list.filter(o => new Date(o.created_at) <= limitDate);
                    }
                    return list;
                },
                calculatedConversionRate() {
                    if (this.showDemoData && this.currentEnv !== 'prod' && this.filteredOrders.length === 0) {
                        return '3.9';
                    }
                    const ordersCount = this.filteredOrders.length;
                    if (ordersCount === 0) return '0.0';
                    
                    let visitors = 0;
                    if (this.activeShopFilter === 'all') {
                        visitors = this.trafficStats.reduce((sum, t) => sum + (parseInt(t.visitors) || 0), 0);
                    } else {
                        const stat = this.trafficStats.find(t => t.brand_id === this.activeShopFilter);
                        visitors = stat ? (parseInt(stat.visitors) || 0) : 0;
                    }
                    
                    if (visitors === 0) {
                        const paid = this.filteredOrders.filter(o => o.status !== 'pending_payment').length;
                        return ((paid / (ordersCount * 15)) * 100).toFixed(1);
                    }
                    return Math.min(100, (ordersCount / visitors) * 100).toFixed(1);
                },
                dashboardOrdersCount() {
                    if (this.showDemoData && this.currentEnv !== 'prod' && this.filteredOrders.length === 0) {
                        return 1204;
                    }
                    return this.filteredOrders.length;
                },
                uniqueCustomersCount() {
                    if (this.showDemoData && this.currentEnv !== 'prod' && this.filteredOrders.length === 0) {
                        return 842;
                    }
                    const emails = this.filteredOrders.map(o => o.customer_email).filter(Boolean);
                    return [...new Set(emails)].length;
                },
                dashboardUniqueVisitors() {
                    if (this.showDemoData && this.currentEnv !== 'prod' && this.filteredOrders.length === 0) {
                        return 31250;
                    }
                    if (this.activeShopFilter === 'all') {
                        return this.trafficStats.reduce((sum, t) => sum + (parseInt(t.visitors) || 0), 0);
                    } else {
                        const stat = this.trafficStats.find(t => t.brand_id === this.activeShopFilter);
                        return stat ? (parseInt(stat.visitors) || 0) : 0;
                    }
                },
                formattedSalesTotal() {
                    if (this.showDemoData && this.currentEnv !== 'prod' && this.filteredOrders.length === 0) {
                        return '€45,230.85';
                    }
                    const paid = this.filteredOrders.filter(o => o.status !== 'pending_payment');
                    const total = paid.reduce((sum, o) => sum + parseFloat(o.total), 0);
                    return `€${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                },
                currentSelectedBrandName() {
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.name : 'Storefront';
                },
                searchedOrders() {
                    if (!this.ordersSearchQuery) return this.filteredOrders;
                    const query = this.ordersSearchQuery.toLowerCase();
                    return this.filteredOrders.filter(o =>
                        (o.id && o.id.toLowerCase().includes(query)) ||
                        (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
                        (o.customer_email && o.customer_email.toLowerCase().includes(query))
                    );
                },
                // Live ⌘ K matching logic
                matchingSearchShops() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    let list = this.brands;
                    if (this.userRole.toLowerCase() === 'merchant') {
                        const userBrandId = localStorage.getItem('sc_admin_brand_id');
                        list = list.filter(b => b.id === userBrandId);
                    }
                    return list.filter(b => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
                },
                matchingSearchOrders() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    let list = this.orders;
                    if (this.userRole.toLowerCase() === 'merchant') {
                        const userBrandId = localStorage.getItem('sc_admin_brand_id');
                        list = list.filter(o => o.brand_id === userBrandId);
                    } else if (this.activeShopFilter !== 'all') {
                        list = list.filter(o => o.brand_id === this.activeShopFilter);
                    }
                    return list.filter(o =>
                        (o.id && String(o.id).toLowerCase().includes(q)) ||
                        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                        (o.customer_email && o.customer_email.toLowerCase().includes(q))
                    );
                },
                matchingSearchProducts() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    let list = this.products;
                    if (this.userRole.toLowerCase() === 'merchant') {
                        const userBrandId = localStorage.getItem('sc_admin_brand_id');
                        list = list.filter(p => p && p.brand_id === userBrandId);
                    } else if (this.activeShopFilter !== 'all') {
                        list = list.filter(p => p && p.brand_id === this.activeShopFilter);
                    }
                    return list.filter(p =>
                        p && (
                            (p.title && p.title.toLowerCase().includes(q)) ||
                            (p.description && p.description.toLowerCase().includes(q)) ||
                            (p.tag && p.tag.toLowerCase().includes(q)) ||
                            (p.id && String(p.id).toLowerCase().includes(q))
                        )
                    );
                },
                matchingSearchCustomers() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    let list = this.customers;
                    if (this.userRole.toLowerCase() === 'merchant') {
                        const userBrandId = localStorage.getItem('sc_admin_brand_id');
                        list = list.filter(c => c.brand_id === userBrandId);
                    }
                    return list.filter(c =>
                        (c.name && c.name.toLowerCase().includes(q)) ||
                        (c.email && c.email.toLowerCase().includes(q))
                    );
                },
                matchingSearchActions() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    const allActions = [
                        { name: 'Go to Overview Dashboard', view: 'overview' },
                        { name: 'Go to Catalog / Products', view: 'products' },
                        { name: 'Go to Transactions / Orders', view: 'orders' },
                        { name: 'Go to Reports & Analytics', view: 'reports' },
                        { name: 'Go to Messages Inbox', view: 'messages' },
                        { name: 'Go to Team Performance', view: 'team-performance' },
                        { name: 'Go to Campaigns / Marketing', view: 'campaigns' },
                        { name: 'Go to Customer List', view: 'customers' },
                        { name: 'Go to Channels (Brand Shops)', view: 'brands', superadminOnly: true },
                        { name: 'Go to Roles & Permissions', view: 'roles-permissions' },
                        { name: 'Go to Billing & Subscription', view: 'billing-subscription' },
                        { name: 'Go to Integrations (Settings)', view: 'settings' },
                        { name: 'Go to Customer Support Helpdesk', view: 'customer-support' },
                        { name: 'Go to Help Center Documentation', view: 'help' }
                    ];

                    return allActions.filter(act => {
                        if (act.superadminOnly && this.userRole.toLowerCase() !== 'superadmin') {
                            return false;
                        }
                        return act.name.toLowerCase().includes(q);
                    });
                },
                operatorInitials() {
                    const first = this.operatorFirstName || '';
                    const last = this.operatorLastName || '';
                    if (first || last) {
                        return ((first[0] || '') + (last[0] || '')).toUpperCase();
                    }
                    return '??';
                },
                operatorName() {
                    return `${this.operatorFirstName} ${this.operatorLastName}`.trim();
                },
                hasGlobalUnsavedChanges() {
                    if (this.activeView === 'designer' && this.$refs.designerView && this.$refs.designerView.hasUnsavedChanges) {
                        return true;
                    }
                    if (this.activeView === 'settings' && this.$refs.settingsView && this.$refs.settingsView.hasSettingsChanged) {
                        return true;
                    }
                    return false;
                }
            },
            watch: {
                activeShopFilter(newVal) {
                    this.updateSettingsContext();
                    if (newVal && newVal !== 'all') {
                        localStorage.setItem('sc_admin_brand_id', newVal);
                        this.previewActiveBrandId = newVal;
                        this.isCreatingBrand = false;
                    } else {
                        localStorage.removeItem('sc_admin_brand_id');
                    }
                },
                filteredOrders(newVal) {
                    this.renderAnalyticsCharts();
                },
                isStrategyGenerating(newVal) {
                    if (newVal) {
                        this.startGlobalProtocolPolling();
                    } else {
                        this.stopGlobalProtocolPolling();
                    }
                }
            },
            mounted() {
                // Initialize environment variables
                const hostname = window.location.hostname;
                let defaultEnv = 'local';
                if (hostname.includes('dev-dash.') || hostname.includes('dash.dev.')) {
                    defaultEnv = 'dev';
                } else if (hostname.includes('dash.stricktlycoffee.be')) {
                    defaultEnv = 'prod';
                }

                const savedEnv = localStorage.getItem('sc_admin_env');
                if (savedEnv && (savedEnv !== 'local' || defaultEnv === 'local')) {
                    this.currentEnv = savedEnv;
                } else {
                    this.currentEnv = defaultEnv;
                }

                // Parse initial URL segments
                const pathSegments = window.location.pathname.split('/').filter(Boolean);
                const primary = pathSegments[0];
                let initialView = 'overview';
                if (primary === 'channels') {
                    initialView = 'brands';
                } else if (primary === 'integrations') {
                    initialView = 'settings';
                } else {
                    const validViews = ['overview', 'brand-center', 'products', 'media', 'orders', 'reports', 'messages', 'team-performance', 'campaigns', 'coupons', 'customers', 'roles-permissions', 'billing-subscription', 'customer-support', 'help', 'warehouse-sim'];
                    if (validViews.includes(primary)) {
                        initialView = primary;
                    }
                }
                this.requestedInitialView = initialView;

                // Verify Auth session
                const token = localStorage.getItem('sc_admin_token');
                const role = localStorage.getItem('sc_admin_role');
                const brandId = localStorage.getItem('sc_admin_brand_id');
                if (token) {
                    this.isLoggedIn = true;
                    if (role) this.userRole = role;
                    this.userEmail = localStorage.getItem('sc_admin_email') || '';
                    this.activeShopFilter = brandId || 'all';
                    this.bootDashboard();
                    this.resolveRouteFromURL();
                    this.fetchCurrentProfile();
                }

                // Set up popstate and beforeunload listeners
                window.addEventListener('popstate', this.handlePopState);
                window.addEventListener('beforeunload', this.handleBeforeUnload);

                // Apply theme setting
                this.applyTheme(this.appTheme);

                // Parse Stripe Connect and Setup URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const stripeConnectParam = urlParams.get('stripe_connect');
                const stripeSetupParam = urlParams.get('stripe_setup');
                const stripeBrandId = urlParams.get('brandId');
                const sessionId = urlParams.get('session_id');

                if (stripeConnectParam && stripeBrandId) {
                    if (stripeConnectParam === 'success') {
                        this.showNotification('Stripe Connect onboarding completed successfully!');
                    } else if (stripeConnectParam === 'refresh') {
                        this.showNotification('Stripe Connect onboarding refreshed.');
                    }
                    
                    // Clear the query params from the URL cleanly
                    const cleanUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                    
                    // Switch view to billing subscription and select the correct brand
                    this.activeShopFilter = stripeBrandId;
                    this.switchView('billing-subscription');
                } else if (stripeSetupParam && stripeBrandId) {
                    if (stripeSetupParam === 'success' && sessionId) {
                        this.verifyStripeCardSetup(stripeBrandId, sessionId);
                    } else if (stripeSetupParam === 'cancel') {
                        this.showNotification('Credit card linking cancelled.');
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                        this.activeShopFilter = stripeBrandId;
                        this.switchView('billing-subscription');
                    }
                }

                // Setup global key listener for ⌘ K and click outside
                window.addEventListener('keydown', this.handleGlobalKeydowns);
                document.addEventListener('click', this.handleDocumentClick);
            },
            unmounted() {
                window.removeEventListener('keydown', this.handleGlobalKeydowns);
                document.removeEventListener('click', this.handleDocumentClick);
                window.removeEventListener('popstate', this.handlePopState);
                window.removeEventListener('beforeunload', this.handleBeforeUnload);
                this.stopGlobalProtocolPolling();
            },
            methods: {
                isSidebarLinkDisabled(viewName) {
                    if (!this.isLoggedIn) return true;
                    // If superadmin is on "ALL" view (no brand context selected), allow all sidebar links
                    if (this.userRole.toLowerCase() === 'superadmin' && (this.activeShopFilter === 'all' || !this.activeShopFilter)) {
                        return false;
                    }
                    if (['overview', 'help', 'billing-subscription', 'brands', 'learning'].includes(viewName)) {
                        return false;
                    }
                    if (viewName === 'settings' && this.userRole.toLowerCase() === 'superadmin' && this.activeShopFilter === 'all') {
                        return false;
                    }
                    if (viewName === 'settings') {
                        return false;
                    }
                    if (viewName === 'brand-center') {
                        if (this.activeShopFilter === 'all' || !this.activeShopFilter) {
                            return true;
                        }
                        return false;
                    }
                    if (this.brands.length === 0) return true;
                    if (this.activeShopFilter === 'all' || !this.activeShopFilter) return true;
                    if (!this.isBrandStrategyConfigured) return true;
                    if (viewName === 'campaigns') {
                        const activeBrandProducts = this.products.filter(p => p.brand_id === this.activeShopFilter);
                        if (activeBrandProducts.length === 0) return true;
                    }
                    return false;
                },
                startGlobalProtocolPolling() {
                    this.stopGlobalProtocolPolling();
                    this.globalProtocolInterval = setInterval(async () => {
                        await this.loadBrands();
                        const activeBrand = this.brands.find(b => b.id === this.activeShopFilter);
                        if (activeBrand && activeBrand.protocol_status !== 'generating') {
                            this.stopGlobalProtocolPolling();
                            if (this.activeView === 'brand-center' && this.$refs.brandCenterView && this.$refs.brandCenterView.loadBrandCanvas) {
                                this.$refs.brandCenterView.loadBrandCanvas();
                                this.$refs.brandCenterView.loadManuscripts();
                                this.$refs.brandCenterView.loadManuscriptStats();
                            }
                        }
                    }, 5000);
                },
                stopGlobalProtocolPolling() {
                    if (this.globalProtocolInterval) {
                        clearInterval(this.globalProtocolInterval);
                        this.globalProtocolInterval = null;
                    }
                },
                async fetchAiEstimate(operation, inputText = '') {
                    try {
                        const res = await fetch(`${this.apiBaseUrl}/api/global/ai-estimator/predict`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ operation, inputText })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            return data.estimates;
                        }
                    } catch (e) {
                        console.error('[AI Estimator] Prediction failed:', e.message);
                    }
                    return null;
                },
                goToCurrentOnboardingStep() {
                    const step = this.onboardingStep;
                    if (step === 1) {
                        this.switchView('brands');
                    } else if (step === 2) {
                        this.switchView('brand-center');
                    } else if (step === 3) {
                        this.switchView('products');
                    } else if (step === 4) {
                        this.switchView('campaigns');
                    }
                },
                async verifyStripeCardSetup(brandId, sessionId) {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/billing/setup-complete?brandId=${brandId}&sessionId=${sessionId}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            this.showNotification('Credit card linked successfully for subscription auto-renewal!');
                        } else {
                            alert('Card linking validation failed: ' + (data.error || 'unknown error'));
                        }
                    } catch (err) {
                        alert('Card linking validation error: ' + err.message);
                    } finally {
                        // Clear the query params from the URL cleanly
                        const cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                        
                        // Switch view to billing subscription and select the correct brand
                        this.activeShopFilter = brandId;
                        this.switchView('billing-subscription');
                        
                        // Reload brand details to synchronize fields
                        await this.loadBrands();
                    }
                },
                getBrandSubdomain(brand) {
                    if (!brand) return '';
                    if (brand.custom_domain) return brand.custom_domain;
                    const prefix = (brand.subdomain || '').split('.')[0];
                    if (this.currentEnv === 'dev') {
                        return `${prefix}-dev.stricktlycoffee.be`;
                    }
                    return `${prefix}.${this.baseBrandDomain}`;
                },
                async loadUsers() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/users`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (response.ok) {
                            this.users = await response.json();
                        }
                    } catch (err) {
                        console.error('Failed to load users:', err);
                    }
                },
                async inviteUser(email, role, brandId) {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/users/invite`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify({ email, role, brand_id: brandId })
                        });
                        if (response.ok) {
                            this.showNotification('Operator invited successfully!');
                            await this.loadUsers();
                            return true;
                        } else {
                            const err = await response.json();
                            alert(`Invite failed: ${err.error}`);
                            return false;
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                        return false;
                    }
                },
                async removeUser(userId) {
                    if (confirm('Are you sure you want to remove this operator account?')) {
                        try {
                            const response = await fetch(`${this.apiBaseUrl}/api/global/users/${userId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                            });
                            if (response.ok) {
                                this.showNotification('Operator account removed.');
                                await this.loadUsers();
                            } else {
                                const err = await response.json();
                                alert(`Error removing operator: ${err.error}`);
                            }
                        } catch (err) {
                            alert(`Error: ${err.message}`);
                        }
                    }
                },
                async bulkDeleteUsers(userIds) {
                    if (confirm(`Are you sure you want to remove the ${userIds.length} selected operator accounts?`)) {
                        try {
                            const response = await fetch(`${this.apiBaseUrl}/api/global/users/bulk-delete`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                                },
                                body: JSON.stringify({ ids: userIds })
                            });
                            if (response.ok) {
                                this.showNotification('Selected operator accounts removed.');
                                await this.loadUsers();
                                return true;
                            } else {
                                const err = await response.json();
                                alert(`Error removing operators: ${err.error}`);
                                return false;
                            }
                        } catch (err) {
                            alert(`Error: ${err.message}`);
                            return false;
                        }
                    }
                    return false;
                },
                 handleGlobalKeydowns(e) {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                        e.preventDefault();
                        this.openSearchModal();
                    }
                    if (e.key === 'Escape') {
                        this.closeSearchModal();
                        this.closeUpcomingModal();
                    }
                },
                handlePopState(e) {
                    this.resolveRouteFromURL();
                },
                handleBeforeUnload(event) {
                    if (this.activeView === 'brands' && this.$refs.brandsView && this.$refs.brandsView.isCreatingBrand) {
                        event.preventDefault();
                        event.returnValue = '';
                    }
                },
                handleDocumentClick(e) {
                    if (this.workspaceDropdownOpen) {
                        const selector = this.$el.querySelector('.profile-selector-btn');
                        const menu = this.$el.querySelector('.workspace-dropdown-menu');
                        if (selector && !selector.contains(e.target) && menu && !menu.contains(e.target)) {
                            this.workspaceDropdownOpen = false;
                        }
                    }
                    if (this.profileDropdownOpen) {
                        const selector = this.$el.querySelector('.footer-profile');
                        const menu = this.$el.querySelector('.profile-dropdown-menu');
                        if (selector && !selector.contains(e.target) && menu && !menu.contains(e.target)) {
                            this.profileDropdownOpen = false;
                        }
                    }
                },
                toggleDemoRole() {
                    this.userRole = this.userRole.toLowerCase() === 'superadmin' ? 'Merchant' : 'Superadmin';
                    localStorage.setItem('sc_admin_role', this.userRole);
                    this.showNotification(`Switched role context to ${this.userRole}`);
                    this.profileDropdownOpen = false;
                },
                assumeStoreAdmin() {
                    this.userRole = 'Merchant';
                    localStorage.setItem('sc_admin_role', this.userRole);
                    this.showNotification(`Assumed role as Store Administrator for ${this.activeWorkspaceName}`);
                    this.profileDropdownOpen = false;
                },
                openProfileModal() {
                    this.profilePassword = '';
                    this.profilePasswordConfirm = '';
                    this.profileModalOpen = true;
                    this.profileDropdownOpen = false;
                },
                async updateUserProfile() {
                    // Update names locally
                    localStorage.setItem('sc_operator_first_name', this.operatorFirstName);
                    localStorage.setItem('sc_operator_last_name', this.operatorLastName);

                    if (this.profilePassword && this.profilePassword.trim()) {
                        if (this.profilePassword.trim().length < 6) {
                            alert('Password must be at least 6 characters.');
                            return;
                        }
                        if (this.profilePassword !== this.profilePasswordConfirm) {
                            alert('Passwords do not match.');
                            return;
                        }
                    }

                    try {
                        const bodyData = {
                            firstName: this.operatorFirstName,
                            lastName: this.operatorLastName
                        };
                        if (this.profilePassword && this.profilePassword.trim()) {
                            bodyData.password = this.profilePassword;
                        }

                        const response = await fetch(`${this.apiBaseUrl}/api/global/users/update-profile`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(bodyData)
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            alert(data.error || 'Failed to update profile.');
                            return;
                        }
                    } catch (err) {
                        alert(`Error updating profile: ${err.message}`);
                        return;
                    }

                    this.showNotification('Profile updated successfully.');
                    this.profileModalOpen = false;
                },
                async fetchCurrentProfile() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/users/me`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            this.operatorFirstName = data.first_name || '';
                            this.operatorLastName = data.last_name || '';
                            localStorage.setItem('sc_operator_first_name', data.first_name || '');
                            localStorage.setItem('sc_operator_last_name', data.last_name || '');
                        }
                    } catch (e) {
                        console.error('Failed to fetch profile info:', e);
                    }
                },
                applyTheme(theme) {
                    this.appTheme = theme;
                    localStorage.setItem('sc_admin_theme', theme);
                    document.documentElement.classList.remove('light-theme', 'dark-theme');
                    if (theme === 'light') {
                        document.documentElement.classList.add('light-theme');
                    } else if (theme === 'dark') {
                        document.documentElement.classList.add('dark-theme');
                    }
                },
                openNewTransactionModal() {
                    this.newTransactionModal.brand_id = this.activeShopFilter !== 'all' ? this.activeShopFilter : (this.brands[0] ? this.brands[0].id : '');
                    const brandProds = this.newTransactionModal.brand_id ? this.products.filter(p => p.brand_id === this.newTransactionModal.brand_id) : this.products;
                    this.newTransactionModal.product_id = brandProds[0] ? brandProds[0].id : (this.products[0] ? this.products[0].id : '');
                    this.newTransactionModal.customer_name = '';
                    this.newTransactionModal.customer_email = '';
                    this.newTransactionModal.quantity = 1;
                    this.newTransactionModal.status = 'paid';
                    this.newTransactionModal.open = true;
                },
                closeNewTransactionModal() {
                    this.newTransactionModal.open = false;
                },
                async submitNewTransaction() {
                    const prod = this.products.find(p => p.id === this.newTransactionModal.product_id);
                    const unitPrice = prod ? parseFloat(prod.price) : 25.00;
                    const total = unitPrice * parseInt(this.newTransactionModal.quantity, 10);
                    
                    const payload = {
                        brand_id: this.newTransactionModal.brand_id,
                        customer_name: this.newTransactionModal.customer_name,
                        customer_email: this.newTransactionModal.customer_email,
                        total: total,
                        status: this.newTransactionModal.status,
                        items: [
                            {
                                id: prod ? prod.id : 9999,
                                title: prod ? prod.title : 'Custom puck prep set',
                                quantity: parseInt(this.newTransactionModal.quantity, 10),
                                price: unitPrice
                            }
                        ]
                    };

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/orders`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(payload)
                        });

                        if (!response.ok) throw new Error('Network error creating transaction');
                        const resData = await response.json();
                        
                        if (resData.success && resData.order) {
                            this.orders.unshift(resData.order);
                            this.showNotification(`Transaction #${resData.order.id.slice(0, 8)} recorded successfully.`);
                            this.closeNewTransactionModal();
                            nextTick(() => {
                                this.renderAnalyticsCharts();
                            });
                        }
                    } catch (err) {
                        console.error('Failed to create manual order:', err);
                        this.showNotification('Error creating transaction.');
                    }
                },
                exportOrdersCSV() {
                    const data = this.filteredOrders;
                    if (data.length === 0) {
                        this.showNotification('No transactions found to export.');
                        return;
                    }
                    let csvContent = 'data:text/csv;charset=utf-8,';
                    csvContent += 'ID,Brand,Customer Name,Customer Email,Status,Total,Created At\n';
                    data.forEach(o => {
                        csvContent += `"${o.id}","${o.brand_name || o.brand_id}","${o.customer_name}","${o.customer_email}","${o.status}",${o.total},"${o.created_at}"\n`;
                    });
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `sc_transactions_export_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    this.showNotification('CSV export download initialized.');
                },
                selectWorkspace(id) {
                    this.workspaceDropdownOpen = false;
                    if (id === 'create') {
                        this.switchView('brands');
                        return;
                    }
                    this.activeShopFilter = id;
                    this.showNotification(`Workspace context switched.`);
                },
                async deleteProduct(productId) {
                    if (!confirm('Are you sure you want to delete this product from the catalog?')) return;
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products/${productId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (response.ok) {
                            this.showNotification('Product successfully deleted.');
                            this.fetchProducts(); // Refresh catalog list
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error || 'Failed to delete product.'}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                },
                async toggleProductActive(productId, currentActive) {
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products/${productId}/active`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ active: currentActive === 0 || currentActive === false ? 1 : 0 })
                        });
                        if (response.ok) {
                            this.showNotification('Product visibility status updated.');
                            this.fetchProducts(); // Refresh catalog list
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                },
                async bulkUpdateOrderStatus(ids, status) {
                    if (!ids || ids.length === 0) return false;
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/orders/bulk-status`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids, status })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully updated ${ids.length} transaction status to ${status}.`);
                            await this.loadOrders();
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                async bulkDeleteOrders(ids) {
                    if (!ids || ids.length === 0) return false;
                    if (!confirm(`Are you sure you want to permanently delete these ${ids.length} transaction(s)? This action cannot be undone.`)) {
                        return false;
                    }
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/orders/bulk-delete`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully deleted ${ids.length} transaction(s).`);
                            await this.loadOrders();
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                async bulkUpdateProductsActive(ids, active) {
                    if (!ids || ids.length === 0) return false;
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products/bulk-active`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids, active })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully updated status for ${ids.length} product(s).`);
                            this.fetchProducts(); // Refresh catalog
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                async bulkDeleteProducts(ids) {
                    if (!ids || ids.length === 0) return false;
                    if (!confirm(`Are you sure you want to permanently delete these ${ids.length} product(s)? This action cannot be undone.`)) {
                        return false;
                    }
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products/bulk-delete`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully deleted ${ids.length} product(s).`);
                            this.fetchProducts(); // Refresh catalog
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                async bulkVoidCoupons(ids) {
                    if (!ids || ids.length === 0) return false;
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/coupons/bulk-void`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully voided ${ids.length} coupon(s).`);
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                async bulkDeleteCampaigns(ids) {
                    if (!ids || ids.length === 0) return false;
                    if (!confirm(`Are you sure you want to permanently delete these ${ids.length} campaign(s)? This action cannot be undone.`)) {
                        return false;
                    }
                    try {
                        const token = localStorage.getItem('sc_admin_token');
                        const response = await fetch(`${this.apiBaseUrl}/api/global/campaigns/bulk-delete`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ ids })
                        });
                        if (response.ok) {
                            this.showNotification(`Successfully deleted ${ids.length} campaign(s).`);
                            return true;
                        } else {
                            const err = await response.json();
                            this.showNotification(`Error: ${err.error}`);
                        }
                    } catch (e) {
                        this.showNotification(`Error: ${e.message}`);
                    }
                    return false;
                },
                getCompatibility(prod) {
                    if (!prod || !prod.compatibility) return 'All Espresso Machines';
                    if (Array.isArray(prod.compatibility)) return prod.compatibility.join(', ');
                    try {
                        const parsed = JSON.parse(prod.compatibility);
                        if (Array.isArray(parsed)) return parsed.join(', ');
                        return String(parsed);
                    } catch (e) {
                        return String(prod.compatibility);
                    }
                },
                async handleRegister() {
                    this.loginError = '';
                    if (this.loginPassword.length < 6) {
                        this.loginError = 'Password must be at least 6 characters.';
                        return;
                    }
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: this.loginEmail, password: this.loginPassword })
                        });

                        if (response.ok) {
                            this.showNotification('✨ Account registered successfully! Please log in.');
                            this.authMode = 'login';
                            this.loginPassword = '';
                        } else {
                            const err = await response.json();
                            this.loginError = err.error || 'Failed to register account.';
                        }
                    } catch (err) {
                        this.loginError = `Server connection refused: ${err.message}`;
                    }
                },
                // Authenticate Superadmin login
                async handleLogin() {
                    this.loginError = '';
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: this.loginEmail, password: this.loginPassword })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            localStorage.setItem('sc_admin_token', result.token);
                            localStorage.setItem('sc_admin_email', result.email);
                            localStorage.setItem('sc_admin_role', result.role);
                            localStorage.setItem('sc_operator_first_name', result.first_name || '');
                            localStorage.setItem('sc_operator_last_name', result.last_name || '');
                            if (result.brand_id) {
                                localStorage.setItem('sc_admin_brand_id', result.brand_id);
                            } else {
                                localStorage.removeItem('sc_admin_brand_id');
                            }

                            this.userRole = result.role;
                            this.userEmail = result.email;
                            this.operatorFirstName = result.first_name || '';
                            this.operatorLastName = result.last_name || '';
                            this.activeShopFilter = result.brand_id || 'all';
                            this.isLoggedIn = true;
                            this.showNotification('Authentication successful.');
                             this.bootDashboard();
                             this.resolveRouteFromURL();
                        } else {
                            this.loginError = 'Invalid credentials. Please try again.';
                        }
                    } catch (err) {
                        this.loginError = `Server connection refused: ${err.message}`;
                    }
                },
                handleUnauthorizedSession() {
                    localStorage.removeItem('sc_admin_token');
                    localStorage.removeItem('sc_admin_email');
                    localStorage.removeItem('sc_admin_role');
                    localStorage.removeItem('sc_admin_brand_id');
                    this.isLoggedIn = false;
                    this.userEmail = '';
                    this.loginPassword = '';
                    this.showNotification('Your session has expired or is invalid. Please sign in again.');
                },
                 handleLogout() {
                    if (confirm('Log out of Enterprise Portal?')) {
                        localStorage.removeItem('sc_admin_token');
                        localStorage.removeItem('sc_admin_email');
                        localStorage.removeItem('sc_admin_role');
                        localStorage.removeItem('sc_admin_brand_id');
                        this.isLoggedIn = false;
                        this.userEmail = '';
                        this.loginPassword = '';

                        // Reset URL to base path
                        const validViews = ['overview', 'products', 'media', 'orders', 'reports', 'messages', 'team-performance', 'campaigns', 'coupons', 'customers', 'channels', 'roles-permissions', 'billing-subscription', 'integrations', 'customer-support', 'help', 'warehouse-sim'];
                        let pathSegments = window.location.pathname.split('/').filter(Boolean);
                        if (pathSegments.length > 0) {
                            const lastSegment = pathSegments[pathSegments.length - 1];
                            if (validViews.includes(lastSegment)) {
                                pathSegments.pop();
                            }
                        }
                        const newPath = '/' + pathSegments.join('/');
                        if (window.location.pathname !== newPath) {
                            window.history.pushState({}, '', newPath);
                        }
                    }
                },
                changeEnvironment() {
                    localStorage.setItem('sc_admin_env', this.currentEnv);
                    this.showNotification(`Target environment updated to ${this.currentEnv.toUpperCase()}`);
                    this.bootDashboard();
                },
                bootDashboard() {
                    this.loadBrands();
                    this.loadTierFeatures();
                    this.loadOrders();
                    this.loadProducts();
                    this.loadUsers();
                    this.loadCampaigns();
                },
                discardAndLeave() {
                    if (this.activeView === 'designer' && this.$refs.designerView) {
                        this.$refs.designerView.designerBrand = JSON.parse(JSON.stringify(this.$refs.designerView.originalBrandSettings));
                        this.$refs.designerView.inheritStyles = this.$refs.designerView.originalBrandSettings.inherit;
                    }
                    if (this.activeView === 'settings' && this.$refs.settingsView) {
                        this.settingsBrand = JSON.parse(JSON.stringify(this.originalSettingsBrand));
                    }
                    this.showUnsavedChangesModal = false;
                    const nextView = this.pendingNavigationTargetView;
                    this.pendingNavigationTargetView = '';
                    // Disable check temporarily to switch view
                    const cachedHasUnsaved = this.hasGlobalUnsavedChanges;
                    // Force navigation
                    this.activeView = nextView;
                    this.mobileSidebarOpen = false;
                    if (nextView === 'brands' && this.$refs.brandsView) {
                        this.$refs.brandsView.activeSubView = 'list';
                    }
                    this.updateURL();
                },
                async saveAndLeave() {
                    let success = false;
                    if (this.activeView === 'designer' && this.$refs.designerView) {
                        success = await this.$refs.designerView.saveDesignSettings();
                    }
                    if (this.activeView === 'settings' && this.$refs.settingsView) {
                        success = await this.updateBrandSettings();
                    }
                    if (success) {
                        this.showUnsavedChangesModal = false;
                        const nextView = this.pendingNavigationTargetView;
                        this.pendingNavigationTargetView = '';
                        this.activeView = nextView;
                        this.mobileSidebarOpen = false;
                        if (nextView === 'brands' && this.$refs.brandsView) {
                            this.$refs.brandsView.activeSubView = 'list';
                        }
                        this.updateURL();
                    }
                },
                switchView(viewId) {
                    if (this.brandsLoaded && this.brands.length === 0 && viewId !== 'brands' && viewId !== 'help') {
                        alert('No coffee brands have been registered yet. Please create and register your first brand storefront under the "Shops" tab first.');
                        this.activeView = 'brands';
                        this.updateURL();
                        return;
                    }
                    if (this.hasGlobalUnsavedChanges) {
                        this.pendingNavigationTargetView = viewId;
                        this.showUnsavedChangesModal = true;
                        return;
                    }
                    if (this.activeView === 'brands' && this.$refs.brandsView && this.$refs.brandsView.isCreatingBrand) {
                        const confirmExit = confirm("Are you sure you want to exit the setup wizard? Unsaved brand shop details may be lost.");
                        if (!confirmExit) return;
                        this.$refs.brandsView.isCreatingBrand = false;
                    }
                    this.activeView = viewId;
                    this.mobileSidebarOpen = false;
                    if (viewId === 'brands' && this.$refs.brandsView) {
                        this.$refs.brandsView.activeSubView = 'list';
                    }

                    this.updateURL();

                    if (viewId === 'overview' || viewId === 'products' || viewId === 'warehouse-sim' || viewId === 'customers' || viewId === 'reports' || viewId === 'messages' || viewId === 'roles-permissions' || viewId === 'billing-subscription' || viewId === 'team-performance' || viewId === 'campaigns' || viewId === 'customer-support') {
                        this.loadBrands();
                        if (viewId === 'roles-permissions') {
                            this.loadUsers();
                        }
                    }
                    if (viewId === 'products') {
                        this.loadProducts();
                    }
                    if (viewId === 'orders' || viewId === 'overview' || viewId === 'customers' || viewId === 'reports') {
                        this.loadOrders();
                    }
                    if (viewId === 'messages') {
                        this.loadActivity();
                    }
                    if (viewId === 'settings') {
                        this.loadBrands();
                        this.updateSettingsContext();
                    }
                    if (viewId === 'help') {
                        this.loadHelpManual();
                    }
                },
                updateURL() {
                    let newPath = '/' + (this.activeView === 'brands' ? 'channels' : (this.activeView === 'settings' ? 'integrations' : this.activeView));
                    if (this.activeView === 'brands' && this.$refs.brandsView) {
                        const sub = this.$refs.brandsView.activeSubView;
                        if (sub === 'designer') {
                            newPath = '/channels/storefront';
                        } else if (sub === 'landing-designer') {
                            newPath = '/channels/landingpage';
                        }
                    }
                    if (window.location.pathname !== newPath) {
                        window.history.pushState({ viewId: this.activeView }, '', newPath);
                    }
                },
                resolveRouteFromURL() {
                    const pathSegments = window.location.pathname.split('/').filter(Boolean);
                    if (pathSegments.length === 0) {
                        this.switchView('overview');
                        return;
                    }
                    
                    const primary = pathSegments[0];
                    const sub = pathSegments[1];
                    
                    let viewId = 'not-found';
                    if (primary === 'channels') {
                        viewId = 'brands';
                    } else if (primary === 'integrations') {
                        viewId = 'settings';
                    } else if (primary === 'index.html' || primary === 'admin') {
                        viewId = 'overview';
                    } else {
                        const validViews = ['overview', 'products', 'media', 'orders', 'reports', 'messages', 'team-performance', 'campaigns', 'coupons', 'customers', 'roles-permissions', 'billing-subscription', 'customer-support', 'help', 'warehouse-sim'];
                        if (validViews.includes(primary)) {
                            viewId = primary;
                        }
                    }
                    
                    this.activeView = viewId;
                    this.mobileSidebarOpen = false;
                    
                    if (viewId === 'brands') {
                        this.$nextTick(() => {
                            if (this.$refs.brandsView) {
                                if (sub === 'storefront') {
                                    this.$refs.brandsView.activeSubView = 'designer';
                                } else if (sub === 'landingpage') {
                                    this.$refs.brandsView.activeSubView = 'landing-designer';
                                } else {
                                    this.$refs.brandsView.activeSubView = 'list';
                                }
                            }
                        });
                    }
                    
                    // Boot data loaders based on view
                    if (viewId === 'overview' || viewId === 'products' || viewId === 'warehouse-sim' || viewId === 'customers' || viewId === 'reports' || viewId === 'messages' || viewId === 'roles-permissions' || viewId === 'billing-subscription' || viewId === 'team-performance' || viewId === 'campaigns' || viewId === 'customer-support') {
                        this.loadBrands();
                        if (viewId === 'roles-permissions') {
                            this.loadUsers();
                        }
                    }
                    if (viewId === 'products') {
                        this.loadProducts();
                    }
                    if (viewId === 'orders' || viewId === 'overview' || viewId === 'customers' || viewId === 'reports') {
                        this.loadOrders();
                    }
                    if (viewId === 'messages') {
                        this.loadActivity();
                    }
                    if (viewId === 'settings') {
                        this.loadBrands();
                        this.updateSettingsContext();
                    }
                    if (viewId === 'help') {
                        this.loadHelpManual();
                    }
                },
                // Alerts & notifications toast
                showNotification(msg) {
                    this.toastMessage = msg;
                    setTimeout(() => {
                        this.toastMessage = '';
                    }, 3500);
                },
                triggerUpcoming(title, desc) {
                    this.upcomingModal.open = true;
                    this.upcomingModal.title = title;
                    this.upcomingModal.description = desc;
                },
                closeUpcomingModal() {
                    this.upcomingModal.open = false;
                },
                async openSystemStatusModal() {
                    this.systemStatusModalOpen = true;
                    await this.loadSystemStatus();
                },
                closeSystemStatusModal() {
                    this.systemStatusModalOpen = false;
                },
                startAiTicker(modelName) {
                    if (this.aiTicker.intervalId) {
                        clearInterval(this.aiTicker.intervalId);
                    }
                    this.aiTicker.active = true;
                    this.aiTicker.tokens = 0;
                    this.aiTicker.cost = 0.0;

                    let ratePerToken = 0.0000002; // Flash default ($0.20 per million)
                    let stepTokens = 15;
                    let stepSpeed = 80;

                    const lowerModel = (modelName || '').toLowerCase();
                    if (lowerModel.includes('pro') || lowerModel.includes('deep')) {
                        ratePerToken = 0.000003; // Pro default ($3.00 per million)
                        stepTokens = 8;
                        stepSpeed = 120;
                    }

                    this.aiTicker.intervalId = setInterval(() => {
                        this.aiTicker.tokens += Math.floor(stepTokens * (0.8 + Math.random() * 0.4));
                        this.aiTicker.cost = this.aiTicker.tokens * ratePerToken;
                    }, stepSpeed);
                },
                stopAiTicker() {
                    if (this.aiTicker.intervalId) {
                        clearInterval(this.aiTicker.intervalId);
                        this.aiTicker.intervalId = null;
                    }
                    this.aiTicker.active = false;
                },
                async loadSystemStatus() {
                    this.systemStatusLoading = true;
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/system-status`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.ok) {
                            this.systemStatus = await response.json();
                        }
                    } catch(e) {
                        console.error('Error fetching system status diagnostics:', e);
                    } finally {
                        this.systemStatusLoading = false;
                    }
                },
                openSearchModal() {
                    this.searchModalOpen = true;
                    this.searchQuery = '';
                    nextTick(() => {
                        this.$refs.searchInput.focus();
                    });
                },
                closeSearchModal() {
                    this.searchModalOpen = false;
                },
                selectSearchShop(shopId) {
                    this.activeShopFilter = shopId;
                    this.closeSearchModal();
                    this.switchView('settings');
                },
                selectSearchOrder(orderId) {
                    this.closeSearchModal();
                    this.switchView('orders');
                    this.ordersSearchQuery = orderId;
                },
                selectSearchProduct(productId) {
                    this.closeSearchModal();
                    this.switchView('products');
                    this.productsSearchQuery = productId;
                },
                selectSearchCustomer(email) {
                    this.closeSearchModal();
                    this.switchView('customers');
                    this.customerSearchQuery = email;
                },
                viewCustomerOrders(email) {
                    this.switchView('orders');
                    this.ordersSearchQuery = email;
                },
                selectSearchAction(view) {
                    this.closeSearchModal();
                    this.switchView(view);
                },
                async loadTierFeatures() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/ai-tier-features`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && Array.isArray(data.features)) {
                                this.tierFeaturesList = data.features;
                            }
                        }
                    } catch (err) {
                        console.error('Error loading tier features:', err);
                    }
                },
                isFeatureAllowed(featureName) {
                    if (this.activeShopFilter === 'all') return true;
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    if (!brand) return true;
                    if (brand.ai_free_tier) return true;
                    const tier = brand.ai_tier || 'professional';
                    const features = this.tierFeaturesList.find(f => f.tier === tier);
                    if (!features) return true;
                    return !!features[featureName];
                },
                // Fetch Brands List
                async loadBrands() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (!response.ok) throw new Error(`API error: ${response.status}`);
                        this.brands = await response.json();
                        this.updateSettingsContext();

                        // Reset filter if active shop is not in current brands list
                        if (this.activeShopFilter !== 'all' && !this.brands.some(b => b.id === this.activeShopFilter)) {
                            this.activeShopFilter = 'all';
                        }

                        // Default onboarding select option
                        if (this.brands.length > 0) {
                            if (!this.newProduct.brand_id || !this.brands.some(b => b.id === this.newProduct.brand_id)) {
                                this.newProduct.brand_id = this.brands[0].id;
                            }
                            if (!this.shopifyImportBrandId || !this.brands.some(b => b.id === this.shopifyImportBrandId)) {
                                this.shopifyImportBrandId = this.brands[0].id;
                            }
                            if (!this.simBrandId || !this.brands.some(b => b.id === this.simBrandId)) {
                                this.simBrandId = this.brands[0].id;
                            }
                            if (this.activeShopFilter !== 'all' && this.brands.some(b => b.id === this.activeShopFilter)) {
                                this.previewActiveBrandId = this.activeShopFilter;
                            } else {
                                this.previewActiveBrandId = this.brands[0].id;
                            }
                        }

                        // Redirect if no brands exist
                        if (this.brands.length === 0 && this.activeView !== 'brands' && this.activeView !== 'help') {
                            this.activeView = 'brands';
                            this.updateURL();
                        }
                    } catch (err) {
                        console.error('Failed to load brands:', err);
                    } finally {
                        this.brandsLoaded = true;
                    }
                },
                // Fetch Orders List
                async loadOrders() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/orders`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (!response.ok) throw new Error();
                        this.orders = await response.json();
                        await this.loadTrafficStats();
                        nextTick(() => {
                            this.renderAnalyticsCharts();
                        });
                    } catch (err) {
                        console.error('Failed to load orders:', err);
                    }
                },
                async loadTrafficStats() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/analytics/traffic`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (response.ok) {
                            const data = await response.json();
                            this.trafficStats = data.traffic || [];
                        }
                    } catch (err) {
                        console.error('Failed to load traffic stats:', err);
                    }
                },
                async loadCampaigns() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/marketing-campaigns`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (response.ok) {
                            this.campaigns = await response.json();
                        }
                    } catch (err) {
                        console.error('Failed to load campaigns:', err);
                    }
                },
                // Fetch Products List
                async loadProducts() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.status === 401 || response.status === 403) {
                            this.handleUnauthorizedSession();
                            return;
                        }
                        if (!response.ok) throw new Error();
                        this.products = await response.json();
                    } catch (err) {
                        console.error('Failed to load products:', err);
                    }
                },
                fetchProducts() {
                    return this.loadProducts();
                },
                async loadActivity() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/activity`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (response.ok) {
                            this.activityLogs = await response.json();
                        }
                    } catch (err) {
                        console.error('Failed to load activity logs:', err);
                    }
                },
                async sendSimulatedMessage(title, description) {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/activity/simulate`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify({
                                title,
                                description,
                                brand_id: this.activeShopFilter === 'all' ? null : this.activeShopFilter
                            })
                        });
                        if (response.ok) {
                            this.showNotification('Simulated support inquiry posted.');
                            this.loadActivity();
                        }
                    } catch (err) {
                        console.error('Failed to send simulated message:', err);
                    }
                },
                // Onboard New Brand
                async onboardBrand() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(this.newBrand)
                        });

                        if (response.ok) {
                            this.showNotification(`Shop ${this.newBrand.name} onboarded successfully!`);
                            this.newBrand = { id: '', name: '', subdomain: '', contact_email: '', primary_color: '#c5a059', platform: 'shopify', shopify_shop_name: '', shopify_access_token: '', woocommerce_shop_url: '', woocommerce_consumer_key: '', woocommerce_consumer_secret: '', stripe_secret_key: '', stripe_webhook_secret: '', custom_domain: '', logo: '', favicon: '', status: 'draft', stripe_enabled: false, languages: ['en'], ai_tier: 'professional', price_markup: 0.00, billing_type: 'standard', platform_take_rate: 0.15 };
                            await this.loadBrands();
                            this.switchView('overview');
                        } else {
                            const err = await response.json();
                            alert(`Error onboarding shop: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                    }
                },
                // De-onboard Brand
                async deOnboardBrand(brandId) {
                    if (!brandId) {
                        alert('Error: No brand shop selected to delete.');
                        return;
                    }

                    const role = this.userRole.toLowerCase();
                    const userBrandId = localStorage.getItem('sc_admin_brand_id');

                    if (role !== 'superadmin' && (role !== 'merchant' || userBrandId !== brandId)) {
                        this.showNotification('Error: Only platform superadmins or the store manager can delete this brand shop.');
                        return;
                    }

                    if (!confirm(`Are you sure you want to de-onboard and delete "${brandId}"? This cleans up all associated products, orders, and deletes its Cloudflare subdomain!`)) {
                        return;
                    }

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands/${brandId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });

                        if (response.ok) {
                            this.showNotification(`Shop ${brandId} deleted and DNS records cleaned up!`);
                            if (this.activeShopFilter === brandId) {
                                  this.activeShopFilter = 'all';
                            }
                            this.loadBrands();
                        } else {
                            const err = await response.json();
                            alert(`Error de-onboarding: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                    }
                },
                // Update Brand Status (active, paused, archived, draft)
                async updateBrandStatus(brandId, status) {
                    if (status === 'archived' && this.userRole.toLowerCase() !== 'superadmin') {
                        this.showNotification('Error: Only platform superadmins can archive brand storefronts.');
                        return;
                    }

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands/${brandId}/status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify({ status })
                        });

                        if (response.ok) {
                            this.showNotification(`Shop ${brandId} is now ${status}.`);
                            this.loadBrands();
                            this.updateSettingsContext();
                        } else {
                            const err = await response.json();
                            alert(`Error updating brand status: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                    }
                },
                // Add Product manual
                async addProduct() {
                    const features = (this.newProduct.features || '').split('\n').filter(l => l.trim() !== '');
                    const compatibility = (this.newProduct.compatibility || '').split('\n').filter(l => l.trim() !== '');

                    const payload = {
                        ...this.newProduct,
                        price: parseFloat(this.newProduct.price),
                        features,
                        compatibility
                    };

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            this.showNotification('Product added to brand catalog successfully.');
                            this.newProduct = { brand_id: this.brands[0]?.id || '', title: '', price: 132.00, tag: '', image: '', original_link: '', description: '', long_description: '', features: '', compatibility: '', sku: '', external_id: '', translations: {} };
                            this.loadProducts();
                        } else {
                            const err = await response.json();
                            alert(`Error adding product: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                    }
                },
                async updateProduct(productData) {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products/${productData.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(productData)
                        });

                        if (response.ok) {
                            this.showNotification('Product details updated successfully.');
                            this.loadProducts();
                            return true;
                        } else {
                            const err = await response.json();
                            alert(`Error updating product: ${err.error}`);
                            return false;
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                        return false;
                    }
                },
                // File uploads downsizer
                async handleFileSelect(e) {
                    const file = e.target.files[0];
                    if (!file) return;

                    this.uploadingMedia = true;
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` },
                            body: formData
                        });

                        if (response.ok) {
                            const result = await response.json();
                            this.newProduct.image = this.apiBaseUrl + result.url;
                            this.showNotification(`Asset uploaded successfully! ${result.resized ? 'Downsized image.' : ''}`);
                        } else {
                            alert('Upload failed.');
                        }
                    } catch (err) {
                        alert(`Upload error: ${err.message}`);
                    } finally {
                        this.uploadingMedia = false;
                    }
                },
                // Shopify Product Importer Scanners
                async scanShopifyProducts() {
                    if (!this.shopifyImportBrandId) return;

                    this.shopifyProducts = [];
                    this.shopifyScanStatus = `Scanning Shopify product catalog for brand "${this.shopifyImportBrandId}"...`;

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/shopify-import?brandId=${this.shopifyImportBrandId}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });

                        if (response.ok) {
                            const data = await response.json();
                            this.shopifyScanStatus = `Found ${data.products.length} products. Source: ${data.source === 'shopify_api' ? 'Shopify API Connection' : 'Mock sandbox catalog'}`;
                            this.shopifyProducts = data.products;
                        } else {
                            const err = await response.json();
                            this.shopifyScanStatus = `Scan failed: ${err.error}`;
                        }
                    } catch (err) {
                        this.shopifyScanStatus = `Fetch error: ${err.message}`;
                    }
                },
                async importShopifyProduct(e, p) {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = 'Importing...';

                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/shopify-import`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify({
                                brandId: this.shopifyImportBrandId,
                                external_id: String(p.id),
                                title: p.title,
                                price: p.price,
                                image: p.image,
                                description: p.description
                            })
                        });

                        if (response.ok) {
                            btn.style.backgroundColor = 'var(--success)';
                            btn.style.borderColor = 'var(--success)';
                            btn.textContent = '✔ Imported Successfully';
                            this.showNotification(`Product "${p.title}" imported!`);
                        } else {
                            btn.disabled = false;
                            btn.textContent = 'Import to Catalog';
                            const err = await response.json();
                            alert(`Import failed: ${err.error}`);
                        }
                    } catch (err) {
                        btn.disabled = false;
                        btn.textContent = 'Import to Catalog';
                        alert(`Error: ${err.message}`);
                    }
                },
                // Dynamic Settings Bind
                updateSettingsContext() {
                    if (this.activeShopFilter !== 'all') {
                        const brand = this.brands.find(b => b.id === this.activeShopFilter);
                        if (brand) {
                            const langs = brand.languages ? brand.languages.split(',') : ['en'];
                            let theme = {};
                            if (brand.theme_settings) {
                                try {
                                    theme = JSON.parse(brand.theme_settings);
                                } catch(e) {}
                            }
                            this.settingsBrand = {
                                ...brand,
                                secondary_color: theme.secondary_color || '#767676',
                                bg_color: theme.bg_color || '#ffffff',
                                text_color: theme.text_color || '#111111',
                                button_radius: theme.button_radius || '4px',
                                button_text_color: theme.button_text_color || '#ffffff',
                                header_bg_color: theme.header_bg_color || '#ffffff',
                                font_family: theme.font_family || 'Outfit',
                                shopify_access_token: '',
                                stripe_secret_key: '',
                                stripe_webhook_secret: '',
                                subscription_billing_method: brand.subscription_billing_method || 'ledger',
                                languages: langs
                            };
                            this.originalSettingsBrand = JSON.parse(JSON.stringify(this.settingsBrand));
                        }
                    }
                },
                async updateBrandSettings() {
                    // Pre-save subdomain character and conflict validation
                    if (!this.settingsBrand.custom_domain) {
                        const sub = this.settingsBrand.subdomain || '';
                        const slug = sub.split('.')[0] || '';
                        
                        const slugRegex = /^[a-z0-9-]+$/;
                        if (!slug || !slugRegex.test(slug)) {
                            alert('Invalid Subdomain Slug: Only lowercase letters, numbers, and hyphens are allowed.');
                            return;
                        }
                        
                        const conflict = this.brands.some(b => b.id !== this.settingsBrand.id && (b.subdomain || '').split('.')[0] === slug);
                        if (conflict) {
                            alert(`Conflict: The subdomain slug "${slug}" is already in use by another shop.`);
                            return;
                        }
                    }

                    let existingTheme = {};
                    if (this.settingsBrand.theme_settings) {
                        try {
                            existingTheme = typeof this.settingsBrand.theme_settings === 'string'
                                ? JSON.parse(this.settingsBrand.theme_settings)
                                : this.settingsBrand.theme_settings;
                        } catch(e) {}
                    }

                    this.settingsBrand.theme_settings = JSON.stringify({
                        ...existingTheme,
                        secondary_color: this.settingsBrand.secondary_color,
                        bg_color: this.settingsBrand.bg_color,
                        text_color: this.settingsBrand.text_color,
                        button_radius: this.settingsBrand.button_radius,
                        button_text_color: this.settingsBrand.button_text_color,
                        header_bg_color: this.settingsBrand.header_bg_color,
                        font_family: this.settingsBrand.font_family || 'Outfit'
                    });
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`
                            },
                            body: JSON.stringify(this.settingsBrand)
                        });

                        if (response.ok) {
                            this.showNotification('Shop integrations updated successfully.');
                            
                            // Check if any new language was added
                            const origLangs = Array.isArray(this.originalSettingsBrand?.languages) ? this.originalSettingsBrand.languages : [];
                            const curLangs = Array.isArray(this.settingsBrand?.languages) ? this.settingsBrand.languages : [];
                            const addedLangs = curLangs.filter(l => l !== 'en' && !origLangs.includes(l));
                            
                            if (addedLangs.length > 0) {
                                const confirmTranslate = confirm(`✨ You added new language(s): ${addedLangs.join(', ').toUpperCase()}. Would you like the AI to automatically translate all storefront pages/copy into these new languages now? (Practically free, uses a fraction of a cent in tokens)`);
                                if (confirmTranslate) {
                                    this.showNotification(`✨ AI is auto-translating all storefront copy to ${addedLangs.join(', ').toUpperCase()}...`);
                                    fetch(`${this.apiBaseUrl}/api/global/brands/${this.settingsBrand.id}/ai-translate-all`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({})
                                    }).then(res => {
                                        if (res.ok) {
                                            this.showNotification('✨ All storefront content translated successfully!');
                                        }
                                    }).catch(err => console.error('Auto-translate error:', err));
                                }
                            }
                            
                            this.loadBrands();
                            this.originalSettingsBrand = JSON.parse(JSON.stringify(this.settingsBrand));
                            return true;
                        } else {
                            alert('Error updating integrations.');
                            return false;
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                        return false;
                    }
                },
                // Shopify integration manual dynamic downloader
                async loadHelpManual() {
                    try {
                        const res = await fetch('/admin/shopify_manual.md');
                        if (res.ok) {
                            const text = await res.text();

                            // Simple markdown parsing to render headers, lists, and linebreaks
                            let html = text
                                .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.4rem; font-weight: 700; margin: 24px 0 12px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">$1</h2>')
                                .replace(/^## (.*$)/gim, '<h3 style="font-size: 1.1rem; font-weight: 700; margin: 20px 0 10px 0; color: var(--text-main);">$1</h3>')
                                .replace(/^---$/gim, '<hr style="border: 0; border-top: 1px solid var(--border); margin: 20px 0;">')
                                .replace(/^\d+\.\s(.*$)/gim, '<div style="margin-left: 12px; margin-bottom: 8px; font-weight: 500;"><span style="color: var(--accent); font-weight: 700;">•</span> $1</div>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-main); font-weight: 700;">$1</strong>')
                                .replace(/`(.*?)`/g, '<code style="background: #fafbfc; border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #d63384;">$1</code>')
                                .replace(/\n/g, '<br>');

                            this.helpManualHtml = html;
                        } else {
                            this.helpManualHtml = 'Failed to load manual.';
                        }
                    } catch (err) {
                        this.helpManualHtml = `Error loading manual: ${err.message}`;
                    }
                },
                launchWarehouseSimulator() {
                    if (!this.simBrandId) return;
                    const brand = this.brands.find(b => b.id === this.simBrandId);
                    if (!brand) return;

                    let targetUrl;
                    const token = localStorage.getItem('sc_admin_token') || '';
                    if (this.currentEnv === 'local') {
                        targetUrl = `http://localhost/warehouse.html?previewBrandId=${brand.id}&token=${token}`;
                    } else {
                        const domain = this.getBrandSubdomain(brand);
                        targetUrl = `https://${domain}/warehouse.html?token=${token}`;
                    }

                    window.open(targetUrl, '_blank');
                },
                // Helpers for formatting orders inside loop
                formatDate(dateStr) {
                    return new Date(dateStr).toLocaleDateString();
                },
                getOrderProductTitle(order) {
                    if (order.items && order.items.length > 0) {
                        return order.items[0].title;
                    }
                    return 'Custom Puck Prep Set';
                },
                getOrderQty(order) {
                    if (order.items && order.items.length > 0) {
                        return order.items.reduce((sum, i) => sum + i.quantity, 0);
                    }
                    return 1;
                },
                getOrderUnitPrice(order) {
                    if (order.items && order.items.length > 0) {
                        return parseFloat(order.items[0].price).toFixed(2);
                    }
                    return parseFloat(order.total).toFixed(2);
                },
                getBrandName(brandId) {
                    const brand = this.brands.find(b => b.id === brandId);
                    return brand ? brand.name : brandId;
                },
                getStatusLabel(status) {
                    if (status === 'paid' || status === 'sent_to_warehouse' || status === 'shipped') return 'Success';
                    if (status === 'pending_payment') return 'Pending';
                    return 'Refunded';
                },
                getStatusClass(status) {
                    if (status === 'paid' || status === 'sent_to_warehouse' || status === 'shipped') return 'status-success';
                    if (status === 'pending_payment') return 'status-pending';
                    return 'status-refunded';
                },
                toggleDemoDataMode() {
                    this.renderAnalyticsCharts();
                    this.loadCampaigns();
                    if (this.$refs.campaignsView && typeof this.$refs.campaignsView.loadCampaigns === 'function') {
                        this.$refs.campaignsView.loadCampaigns();
                    }
                },
                // Rendering Sales and Category Trends charts
                renderAnalyticsCharts() {
                    const paid = this.filteredOrders.filter(o => o.status !== 'pending_payment');

                    let labels = [];
                    let newUsersData = [];
                    let existingUsersData = [];

                    const timeframe = (this.analyticsTimeframe || 'Monthly').toLowerCase();

                    if (timeframe === 'daily') {
                        labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                        newUsersData = Array(7).fill(0);
                        existingUsersData = Array(7).fill(0);
                        
                        paid.forEach(o => {
                            const d = new Date(o.created_at);
                            const day = (d.getDay() + 6) % 7;
                            const total = parseFloat(o.total) || 0;
                            newUsersData[day] += total * 0.65;
                            existingUsersData[day] += total * 0.35;
                        });
                        
                        if (this.showDemoData && this.currentEnv !== 'prod' && newUsersData.every(v => v === 0)) {
                            newUsersData = [120, 150, 180, 90, 200, 310, 160];
                            existingUsersData = [80, 100, 120, 60, 110, 190, 100];
                        }
                    } else if (timeframe === 'weekly') {
                        labels = ['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'];
                        newUsersData = Array(4).fill(0);
                        existingUsersData = Array(4).fill(0);
                        
                        paid.forEach(o => {
                            const d = new Date(o.created_at);
                            const w = Math.min(3, Math.floor(d.getDate() / 8));
                            const total = parseFloat(o.total) || 0;
                            newUsersData[w] += total * 0.65;
                            existingUsersData[w] += total * 0.35;
                        });
                        
                        if (this.showDemoData && this.currentEnv !== 'prod' && newUsersData.every(v => v === 0)) {
                            newUsersData = [800, 1200, 1500, 1100];
                            existingUsersData = [500, 700, 900, 600];
                        }
                    } else if (timeframe === 'yearly') {
                        labels = ['2022', '2023', '2024', '2025', '2026'];
                        newUsersData = Array(5).fill(0);
                        existingUsersData = Array(5).fill(0);
                        
                        paid.forEach(o => {
                            const d = new Date(o.created_at);
                            const yr = d.getFullYear();
                            const idx = yr - 2022;
                            if (idx >= 0 && idx < 5) {
                                const total = parseFloat(o.total) || 0;
                                newUsersData[idx] += total * 0.65;
                                existingUsersData[idx] += total * 0.35;
                            }
                        });
                        
                        if (this.showDemoData && this.currentEnv !== 'prod' && newUsersData.every(v => v === 0)) {
                            newUsersData = [120000, 145000, 180000, 210000, 245000];
                            existingUsersData = [80000, 95000, 110000, 130000, 155000];
                        }
                    } else { // default 'monthly'
                        labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                        newUsersData = Array(12).fill(0);
                        existingUsersData = Array(12).fill(0);

                        paid.forEach(o => {
                            const date = new Date(o.created_at);
                            const mIdx = date.getMonth();
                            const total = parseFloat(o.total) || 0;
                            newUsersData[mIdx] += total * 0.65;
                            existingUsersData[mIdx] += total * 0.35;
                        });

                        const hasData = newUsersData.some(v => v > 0);
                        if (!hasData && this.showDemoData && this.currentEnv !== 'prod') {
                            newUsersData = [10000, 14000, 17000, 12000, 20000, 38000, 24000, 18000, 16000, 21000, 14000, 17000];
                            existingUsersData = [6000, 8000, 10000, 6000, 11000, 18000, 12000, 9000, 8000, 10000, 6000, 8000];
                        }
                    }

                    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const gridColor = isDarkMode ? '#272b30' : 'rgba(0,0,0,0.03)';
                    const tickColor = isDarkMode ? '#8e9290' : '#9a9fa5';
                    const newUsersColor = isDarkMode ? '#272b30' : '#e6e8ec';
                    const existingUsersColor = isDarkMode ? '#ffffff' : '#1a1d1f';

                    // Sales trend chart
                    const canvasSales = document.getElementById('salesChart');
                    if (canvasSales) {
                        const ctxSales = canvasSales.getContext('2d');
                        if (window.salesChartInstance) {
                            window.salesChartInstance.destroy();
                        }
                        const sType = this.salesChartType || 'bar';
                        window.salesChartInstance = new Chart(ctxSales, {
                            type: sType,
                            data: {
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'New User',
                                        data: newUsersData,
                                        backgroundColor: sType === 'line' ? 'transparent' : newUsersColor,
                                        borderColor: newUsersColor,
                                        borderWidth: 2,
                                        tension: 0.3,
                                        borderRadius: 4,
                                        barThickness: 16
                                    },
                                    {
                                        label: 'Existing User',
                                        data: existingUsersData,
                                        backgroundColor: sType === 'line' ? 'transparent' : existingUsersColor,
                                        borderColor: existingUsersColor,
                                        borderWidth: 2,
                                        tension: 0.3,
                                        borderRadius: 4,
                                        barThickness: 16
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        stacked: sType !== 'line',
                                        grid: { color: gridColor },
                                        ticks: {
                                            color: tickColor,
                                            font: { family: 'Inter', size: 10 },
                                            callback: function (value) {
                                                return value >= 1000 ? (value / 1000) + 'k' : value;
                                            }
                                        }
                                    },
                                    x: {
                                        stacked: sType !== 'line',
                                        grid: { display: false },
                                        ticks: { color: tickColor, font: { family: 'Inter', size: 10 } }
                                    }
                                }
                            }
                        });
                    }

                    // Category chart
                    const brandSalesMap = {};
                    this.brands.forEach(b => brandSalesMap[b.name] = 0);
                    paid.forEach(o => {
                        const brand = this.brands.find(b => b.id === o.brand_id);
                        const bName = brand ? brand.name : o.brand_id;
                        brandSalesMap[bName] = (brandSalesMap[bName] || 0) + parseFloat(o.total);
                    });

                    const labelsBrands = Object.keys(brandSalesMap);
                    const dataBrands = Object.values(brandSalesMap);
                    if (this.showDemoData && this.currentEnv !== 'prod' && (dataBrands.length === 0 || dataBrands.every(v => v === 0))) {
                        labelsBrands.splice(0, 12, 'Espresso', 'Accessories', 'Filter Tools', 'Cleaning');
                        dataBrands.splice(0, 12, 14200, 9800, 7500, 5200);
                    }

                    const canvasFunnel = document.getElementById('funnelChart');
                    if (canvasFunnel) {
                        const ctxFunnel = canvasFunnel.getContext('2d');
                        if (window.funnelChartInstance) {
                            window.funnelChartInstance.destroy();
                        }
                        const fType = this.funnelChartType || 'bar';
                        window.funnelChartInstance = new Chart(ctxFunnel, {
                            type: fType,
                            data: {
                                labels: labelsBrands,
                                datasets: [{
                                    data: dataBrands,
                                    backgroundColor: fType === 'line' ? 'transparent' : existingUsersColor,
                                    borderColor: existingUsersColor,
                                    borderWidth: 2,
                                    tension: 0.3,
                                    borderRadius: 4,
                                    barThickness: 16
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        grid: { color: gridColor },
                                        ticks: {
                                            color: tickColor,
                                            font: { family: 'Inter', size: 10 },
                                            callback: function (value) {
                                                return value >= 1000 ? '€' + (value / 1000) + 'k' : '€' + value;
                                            }
                                        }
                                    },
                                    x: { grid: { display: false }, ticks: { color: tickColor, font: { family: 'Inter', size: 10 } } }
                                }
                            }
                        });
                    }
                }
            }
        }
</script>

<style>
@import "./assets/style.css";

@keyframes purpleGlowPulse {
  0% {
    background-color: rgba(139, 92, 246, 0.08);
    box-shadow: inset 0 0 4px rgba(139, 92, 246, 0.15);
  }
  50% {
    background-color: rgba(139, 92, 246, 0.22);
    box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.4);
  }
  100% {
    background-color: rgba(139, 92, 246, 0.08);
    box-shadow: inset 0 0 4px rgba(139, 92, 246, 0.15);
  }
}
.generating-purple-glow {
  animation: purpleGlowPulse 2.5s infinite ease-in-out !important;
  border-left: 3px solid #8b5cf6 !important;
}
</style>
