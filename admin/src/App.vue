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
                    Warehouse Admin
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 24px; font-weight: 500;">
                    Enterprise Management Portal Authentication</p>
                <form @submit.prevent="handleLogin">
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
                    <button type="submit" class="btn" style="width: 100%;">Authenticate & Launch</button>
                    <div style="color: #ef4444; font-size: 0.8rem; margin-top: 14px;" v-if="loginError">
                        {{ loginError }}
                    </div>
                </form>
            </div>
        </div>

        <!-- Touch overlay to close mobile sidebar -->
        <div class="mobile-sidebar-overlay" :class="{ open: mobileSidebarOpen }" @click="mobileSidebarOpen = false">
        </div>

        <!-- SIDEBAR NAVIGATION MENU -->
        <aside :class="{ open: mobileSidebarOpen }" v-if="isLoggedIn">
            <!-- Top Workspace / Context Selector -->
            <div style="position: relative; margin-bottom: 24px;">
                <div class="profile-selector-btn" @click.stop="userRole.toLowerCase() === 'superadmin' ? (workspaceDropdownOpen = !workspaceDropdownOpen) : null"
                    :style="{ cursor: userRole.toLowerCase() === 'superadmin' ? 'pointer' : 'default' }"
                    style="margin-bottom: 0;">
                    <div class="workspace-selector-avatar">{{ activeWorkspaceLetter }}</div>
                    <div class="profile-selector-meta">
                        <div
                            style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em; line-height: 1;">
                            {{ userRole.toLowerCase() === 'superadmin' ? 'Agency' : 'Merchant' }}</div>
                        <div class="profile-selector-title"
                            style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 4px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {{ activeWorkspaceName }}</div>
                    </div>
                    <span style="color: var(--text-muted); font-size: 0.65rem;" v-if="userRole.toLowerCase() === 'superadmin'">▼</span>
                </div>

                <!-- Custom Workspace switcher dropdown list -->
                <div class="workspace-dropdown-menu" v-if="workspaceDropdownOpen">
                    <div class="workspace-dropdown-item" :class="{ active: activeShopFilter === 'all' }"
                        @click="selectWorkspace('all')">
                        <div class="workspace-dropdown-icon">🌐</div>
                        <div class="workspace-dropdown-text">
                            <strong>All Brand Shops</strong>
                            <span>Show consolidated metrics</span>
                        </div>
                    </div>
                    <div class="workspace-dropdown-divider"></div>
                    <div class="workspace-dropdown-section-title">Brand Shops</div>
                    <div class="workspace-dropdown-item" v-for="b in brands" :key="b.id"
                        :class="{ active: activeShopFilter === b.id }" @click="selectWorkspace(b.id)">
                        <div class="workspace-dropdown-avatar" style="width: 20px; height: 20px; font-size: 0.75rem;">{{
                            b.name.charAt(0) }}</div>
                        <div class="workspace-dropdown-text">
                            <strong>{{ b.name }}</strong>
                            <span>{{ b.subdomain }}.stricktlycoffee.be</span>
                        </div>
                    </div>
                    <div class="workspace-dropdown-divider"></div>
                    <div class="workspace-dropdown-item action-item" @click="selectWorkspace('create')"
                        style="color: var(--accent);">
                        <div class="workspace-dropdown-icon">➕</div>
                        <div class="workspace-dropdown-text">
                            <strong style="color: var(--accent);">Spin Up New Shop</strong>
                            <span>Provision subdomain & stack</span>
                        </div>
                    </div>
                </div>
            </div>

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
                        <button class="nav-link-btn" :class="{ active: activeView === 'products' }"
                            @click="switchView('products')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path
                                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z">
                                </path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            Products
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'orders' }"
                            @click="switchView('orders')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            Transactions
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Reports & Analytics', 'Dynamic multi-tenant analytics graphs, customizable checkout ratios, and seasonal cohort statistics.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Reports & Analytics
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Messages & Notifications', 'Unified notification box to handle customer support tickets, warehouse logistics requests, and dropshipping disputes.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Messages
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Team Performance', 'Audit log trackers, individual manager permissions, and task completion metrics for warehouse staff.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Team Performance
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Campaigns & Marketing Automation', 'Deploy automated AI marketing promotions, launch ad-campaign sequences across Meta/TikTok, and track influencer commissions.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                            Campaigns
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
                            @click="switchView('customers')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Customer List
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" :class="{ active: activeView === 'brands' }"
                            @click="switchView('brands')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                <line x1="4" y1="22" x2="4" y2="15"></line>
                            </svg>
                            Channels
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn" @click="switchView('orders')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Order Management
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Group 3: Management -->
            <div class="nav-group">
                <div class="nav-group-title">Management</div>
                <ul class="nav-links">
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Roles & Permissions Manager', 'Configure store managers, customize brand-specific scopes, and audit permission access logs.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Roles & Permissions
                        </button>
                    </li>
                    <li>
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Billing & Subscription', 'Manage Stricktly Coffee platform billing subscriptions, integration quotas, and usage logs.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            Billing & Subscription
                        </button>
                    </li>
                    <li>
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
                        <button class="nav-link-btn"
                            @click="triggerUpcoming('Customer Support', 'Direct chat line setup, email auto-responders, and Zendesk integration parameters.')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path
                                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z">
                                </path>
                            </svg>
                            Customer Support
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
                    <li>
                        <button class="nav-link-btn" @click="switchView('settings')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path
                                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z">
                                </path>
                            </svg>
                            System Settings
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Footer Profile Container -->
            <div class="footer-profile" @click="handleLogout" style="cursor: pointer;">
                <div class="profile-selector-avatar">{{ footerLetter }}</div>
                <div class="footer-profile-meta">
                    <div class="footer-profile-name">{{ footerUsername }}</div>
                    <div class="footer-profile-role">{{ userRole }}</div>
                </div>
                <span style="color: var(--text-muted); font-size: 0.72rem;">▼</span>
            </div>
        </aside>

        <!-- MAIN WORKSPACE -->
        <main v-if="isLoggedIn">
            <!-- Top Navigation Header -->
            <!-- Top Navigation Header -->
            <header>
                <!-- TOP ROW: BREADCRUMBS & TOP NAV CONTROLS -->
                <div class="header-top-row"
                    style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
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
                    <div style="display: flex; align-items: center; gap: 16px;">
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
                            @click="triggerUpcoming('System Alerts', 'Platform status audits.')"
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
                <div class="header-bottom-row"
                    style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; width: 100%;">
                    <!-- Left: Welcome back -->
                    <div class="greeting-header"
                        style="font-size: 1.8rem; font-weight: 700; font-family: var(--font-display); color: var(--text-main); letter-spacing: -0.03em; margin: 0;">
                        Welcome back, {{ welcomeName }}</div>

                    <!-- Right: Quick Filters -->
                    <div style="display: flex; align-items: center; gap: 10px;" v-if="activeView === 'overview'">
                        <!-- Timeframe select dropdown -->
                        <button class="pill-btn"
                            @click="triggerUpcoming('Timeframe Switcher', 'Adjusts metrics intervals.')"
                            style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            Daily <span style="font-size: 0.65rem; color: var(--text-muted);">▼</span>
                        </button>

                        <!-- Calendar Date Select -->
                        <button class="pill-btn"
                            @click="triggerUpcoming('Calendar Integration', 'Select custom dashboard ranges.')"
                            style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            6 Nov 2025
                        </button>

                        <!-- CSV Export button matching reference -->
                        <button class="pill-btn dark"
                            @click="triggerUpcoming('CSV Export Engine', 'Generates customized CSV ledger files for tax computation.')"
                            style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--primary); background: var(--primary); color: var(--bg-color); font-weight: 600; font-size: 0.85rem; height: 40px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
            </header>

            <!-- VIEW 1: OVERVIEW & ANALYTICS -->
            <div id="view-overview" class="admin-view" :class="{ active: activeView === 'overview' }">

                <!-- Four Metrics Cards with mini bar sparklines -->
                <div class="metrics-grid">
                    <!-- CARD 1: REVENUE -->
                    <div class="metric-card">
                        <span class="metric-label">Total Revenue</span>
                        <div class="metric-main-row">
                            <span class="metric-value">{{ formattedSalesTotal }}</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar active"
                                    style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active"
                                    style="height: 20px; width: 4px; border-radius: 2px;"></div>
                            </div>
                        </div>
                        <div class="metric-info-row">
                            <span class="metric-change"
                                style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                                +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                            </span>
                        </div>
                    </div>
                    <!-- CARD 2: ORDERS -->
                    <div class="metric-card">
                        <span class="metric-label">Total Orders</span>
                        <div class="metric-main-row">
                            <span class="metric-value">{{ filteredOrders.length }}</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar active"
                                    style="height: 14px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 18px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar active"
                                    style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 10px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar" style="height: 16px; width: 4px; border-radius: 2px;">
                                </div>
                            </div>
                        </div>
                        <div class="metric-info-row">
                            <span class="metric-change"
                                style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                                +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                            </span>
                        </div>
                    </div>
                    <!-- CARD 3: CUSTOMERS -->
                    <div class="metric-card">
                        <span class="metric-label">New Customers</span>
                        <div class="metric-main-row">
                            <span class="metric-value">{{ uniqueCustomersCount }}</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active"
                                    style="height: 18px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar active"
                                    style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 6px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;">
                                </div>
                            </div>
                        </div>
                        <div class="metric-info-row">
                            <span class="metric-change"
                                style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                                +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                            </span>
                        </div>
                    </div>
                    <!-- CARD 4: CONVERSION -->
                    <div class="metric-card">
                        <span class="metric-label">Conversion Rate</span>
                        <div class="metric-main-row">
                            <span class="metric-value">{{ calculatedConversionRate }}%</span>
                            <div class="metric-sparkline">
                                <div class="metric-sparkbar active"
                                    style="height: 10px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 22px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar" style="height: 14px; width: 4px; border-radius: 2px;">
                                </div>
                                <div class="metric-sparkbar" style="height: 8px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar active"
                                    style="height: 24px; width: 4px; border-radius: 2px;"></div>
                                <div class="metric-sparkbar" style="height: 12px; width: 4px; border-radius: 2px;">
                                </div>
                            </div>
                        </div>
                        <div class="metric-info-row">
                            <span class="metric-change"
                                style="color: var(--success); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                                +0,94 <span style="color: var(--text-muted); font-weight: 500;">last year</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Charts Trend panels -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header">
                            <div class="chart-left-header">
                                <div class="chart-title">
                                    Sales Trend
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2.5" style="color: var(--text-muted);">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                </div>
                                <div class="chart-legends">
                                    <div class="chart-legend-item">
                                        <div class="chart-legend-dot" style="background: #e6e8ec;"></div>
                                        New User
                                    </div>
                                    <div class="chart-legend-item">
                                        <div class="chart-legend-dot" style="background: #1a1d1f;"></div>
                                        Existing User
                                    </div>
                                </div>
                            </div>
                            <div class="tab-track">
                                <button class="tab-pill">Weekly</button>
                                <button class="tab-pill active">Monthly</button>
                                <button class="tab-pill">Yearly</button>
                            </div>
                        </div>
                        <div
                            style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600;">
                            Total Revenue: <span
                                style="font-size: 1.1rem; color: var(--text-main); font-weight: 800; margin-left: 4px;">{{
                                formattedSalesTotal }}</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="salesChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <div class="chart-header">
                            <div class="chart-title">
                                Revenue Breakdown
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5" style="color: var(--text-muted);">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </div>
                            <button class="pill-btn" style="padding: 4px 8px; font-size: 0.75rem; height: 32px;">
                                Jan 1 - Aug 30 <span style="font-size: 0.65rem; color: var(--text-muted);">▼</span>
                            </button>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">
                            Revenue by Category
                            <div style="font-size: 1.4rem; color: var(--text-main); font-weight: 700; margin-top: 2px;">
                                {{ formattedSalesTotal }}</div>
                        </div>

                        <div class="ai-banner"
                            @click="triggerUpcoming('AI Business Insights', 'Launches deep neural analytics analysis targeting dropshipping conversions.')">
                            <span>✨ Get AI insight for better analysis</span>
                            <span style="color: var(--text-muted);">→</span>
                        </div>

                        <div class="chart-container" style="height: 180px;">
                            <canvas id="funnelChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions Card matching mockup layout exactly -->
                <div class="panel" style="margin-top: 24px;">
                    <div class="panel-header">
                        <h3 class="panel-title">
                            Recent Transactions
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" style="color: var(--text-muted);">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </h3>
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <div class="header-search-container" style="width: 220px; position: relative;">
                                <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2.5"
                                    style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input type="text" class="header-search-input" placeholder="Search transactions..."
                                    v-model="ordersSearchQuery"
                                    style="padding: 6px 12px 6px 30px; height: 36px; line-height: 36px; border: 1px solid var(--border); border-radius: 8px; width: 100%; background: var(--card-bg); color: var(--text-main); font-size: 0.82rem;">
                            </div>
                            <button class="pill-btn"
                                @click="triggerUpcoming('Transactions Ledger Creator', 'Manually inject transactions.')"
                                style="height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 6px; margin: 0;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5" style="margin-right: 2px;">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Transaction
                            </button>
                            <button class="action-dots-btn"
                                @click="triggerUpcoming('Batch Tools', 'Bulk invoice exports and status alterations.')"
                                style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); font-size: 1.1rem; cursor: pointer;">···</button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th class="checkbox-cell" style="width: 40px; text-align: center;">
                                        <div class="checkbox-custom"
                                            style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; display: inline-block;">
                                        </div>
                                    </th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        ID</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Customer</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Product</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Status</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Qty</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Unit Price</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted);">
                                        Total Revenue</th>
                                    <th
                                        style="font-weight: 600; font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); text-align: center;">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="order in searchedOrders" :key="order.id">
                                    <td class="checkbox-cell" style="text-align: center;">
                                        <div class="checkbox-custom"
                                            style="width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; display: inline-block;">
                                        </div>
                                    </td>
                                    <td><strong style="color: var(--text-muted);">#{{ order.id.slice(0, 5) }}</strong>
                                    </td>
                                    <td>
                                        <div><strong>{{ order.customer_name }}</strong></div>
                                    </td>
                                    <td>{{ getOrderProductTitle(order) }}</td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem;"
                                            :style="{ color: order.status === 'pending_payment' ? '#f59e0b' : (order.status === 'refunded' ? '#9a9fa5' : '#10b981') }">
                                            <span
                                                style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"
                                                :style="{ background: order.status === 'pending_payment' ? '#f59e0b' : (order.status === 'refunded' ? '#9a9fa5' : '#10b981') }"></span>
                                            {{ getStatusLabel(order.status) }}
                                        </div>
                                    </td>
                                    <td>{{ getOrderQty(order) }}</td>
                                    <td>€{{ getOrderUnitPrice(order) }}</td>
                                    <td><strong>€{{ parseFloat(order.total).toFixed(2) }}</strong></td>
                                    <td style="text-align: center;">
                                        <button class="action-dots-btn"
                                            @click="triggerUpcoming('Order Operations', 'Edit shipping addresses, update delivery carriers, and print receipts.')"
                                            style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-muted); cursor: pointer; font-size: 0.9rem;">···</button>
                                    </td>
                                </tr>
                                <tr v-if="searchedOrders.length === 0">
                                    <td colspan="9"
                                        style="text-align: center; color: var(--text-muted); padding: 30px;">No recent
                                        transactions matches found.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- VIEW 2: BRAND SHOPS -->
            <div id="view-brands" class="admin-view" :class="{ active: activeView === 'brands' }">
                <div class="panel" v-if="userRole.toLowerCase() === 'superadmin'">
                    <h3 class="panel-title">Spin Up New Brand Shop</h3>
                    <form @submit.prevent="onboardBrand" style="margin-top: 15px;">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Brand ID (Unique Slug, e.g. "pesado")</label>
                                <input type="text" v-model="newBrand.id" required placeholder="pesado">
                            </div>
                            <div class="form-group">
                                <label>Brand Display Name</label>
                                <input type="text" v-model="newBrand.name" required placeholder="Pesado 58.5">
                            </div>
                            <div class="form-group">
                                <label>Target Host Subdomain</label>
                                <input type="text" v-model="newBrand.subdomain" required
                                    placeholder="pesado.stricktlycoffee.be">
                            </div>
                            <div class="form-group">
                                <label>Support Contact Email</label>
                                <input type="email" v-model="newBrand.contact_email" required
                                    placeholder="support@pesado585.com">
                            </div>
                            <div class="form-group">
                                <label>Brand Primary Custom Color</label>
                                <input type="text" v-model="newBrand.primary_color" placeholder="#c5a059">
                            </div>
                            <div class="form-group">
                                <label>Manual Custom Domain (Optional)</label>
                                <input type="text" v-model="newBrand.custom_domain" placeholder="coffee-brandsite.com">
                            </div>
                            <div class="form-group">
                                <label>Favicon Icon URL (Auto-scraped on Shopify sync)</label>
                                <input type="text" v-model="newBrand.favicon"
                                    placeholder="https://pesado585.com/favicon.ico">
                            </div>
                            <div class="form-group">
                                <label>Logo Image URL (Auto-scraped on Shopify sync)</label>
                                <input type="text" v-model="newBrand.logo" placeholder="https://pesado585.com/logo.png">
                            </div>
                            <div class="form-group form-full">
                                <label>Shopify Shop Name (for automatic asset scraping & sync)</label>
                                <input type="text" v-model="newBrand.shopify_shop_name" placeholder="pesado585.com">
                            </div>
                            <div class="form-group form-full">
                                <label>Shopify Admin API Access Token</label>
                                <input type="password" v-model="newBrand.shopify_access_token"
                                    placeholder="Shopify Admin API Access Token (shpat_...)">
                            </div>
                            <div class="form-group">
                                <label>Stripe Secret Key (API Key)</label>
                                <input type="password" v-model="newBrand.stripe_secret_key"
                                    placeholder="Stripe Secret Key (sk_live_...)">
                            </div>
                            <div class="form-group">
                                <label>Stripe Webhook Secret</label>
                                <input type="password" v-model="newBrand.stripe_webhook_secret"
                                    placeholder="Stripe Webhook Secret (whsec_...)">
                            </div>
                            <div class="form-group form-full" style="margin-top: 10px;">
                                <button type="submit" class="btn">Onboard & Save Configuration</button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="panel">
                    <h3 class="panel-title">Active Brand Subdomains</h3>
                    <div class="table-responsive" style="margin-top: 15px;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Shop ID</th>
                                    <th>Display Name</th>
                                    <th>Target Domains</th>
                                    <th>Shopify Shop Name</th>
                                    <th>Stripe Live</th>
                                    <th>Contact Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="b in brands" :key="b.id">
                                    <td><strong>{{ b.id }}</strong></td>
                                    <td>{{ b.name }}</td>
                                    <td>
                                        <div style="font-weight: 600;">
                                            <a :href="'http://' + b.subdomain" target="_blank"
                                                style="color: var(--text-main); text-decoration: none;">
                                                🔗 {{ b.subdomain }}
                                            </a>
                                        </div>
                                        <div style="font-size: 0.72rem; color: var(--accent); font-weight: 700; margin-top: 4px;"
                                            v-if="b.custom_domain">
                                            🌐 {{ b.custom_domain }}
                                        </div>
                                    </td>
                                    <td>{{ b.shopify_shop_name || 'Mocked (Sandbox)' }}</td>
                                    <td>{{ b.stripe_secret_key ? '✅ Live' : '🚧 Mocked (Sandbox)' }}</td>
                                    <td>{{ b.contact_email || '-' }}</td>
                                    <td>
                                        <button class="btn"
                                            style="padding: 6px 12px; font-size: 0.8rem; background-color: #ef4444; color: #fff; border-color: #ef4444; margin: 0; height: 32px;"
                                            @click="deOnboardBrand(b.id)">
                                            De-onboard
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="brands.length === 0">
                                    <td colspan="7" style="text-align: center; color: var(--text-muted);">No shops
                                        registered.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- Live Storefront Sandbox Preview -->
                    <div class="panel" style="margin-top: 24px;" v-if="brands.length > 0">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                Live Storefront Sandbox Preview
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5" style="color: var(--text-muted);">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </h3>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <select v-model="previewActiveBrandId"
                                    style="width: 180px; font-weight: 600; border-radius: 8px; margin: 0;">
                                    <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                                </select>
                            </div>
                        </div>

                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                            Interactive preview of how the consumer storefront looks and operates for the selected brand
                            shop. Click items, scroll, and test layout directly.
                        </div>

                        <div
                            style="position: relative; width: 100%; height: 500px; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; background: var(--workspace-bg);">
                            <iframe :src="previewIframeSrc" style="width: 100%; height: 100%; border: none;"></iframe>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VIEW 3: MANAGE CATALOG -->
            <div id="view-products" class="admin-view" :class="{ active: activeView === 'products' }">
                    <div class="panel">
                        <h3 class="panel-title">Add Product to Catalog</h3>
                        <form @submit.prevent="addProduct" style="margin-top: 15px;">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Select Target Brand Shop</label>
                                    <select v-model="newProduct.brand_id" required>
                                        <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Product Name / Title</label>
                                    <input type="text" v-model="newProduct.title" required
                                        placeholder="Self-Leveling Spring Tamper">
                                </div>
                                <div class="form-group">
                                    <label>Retail Price (EUR)</label>
                                    <input type="number" step="0.01" v-model="newProduct.price" required
                                        placeholder="132.00">
                                </div>
                                <div class="form-group">
                                    <label>Catalog Tag Badge (e.g. "Best Seller")</label>
                                    <input type="text" v-model="newProduct.tag" placeholder="AD Edition">
                                </div>

                                <!-- Drag-and-drop Image/Video Uploader Field -->
                                <div class="form-group form-full">
                                    <label>Product Media (Upload Resizes Images Dynamically)</label>
                                    <div class="uploader-box" @click="$refs.fileInput.click()">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2.5"
                                            style="color: var(--text-muted); margin-bottom: 6px;">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">
                                            Click to upload or drag files here</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                                            Image downsizing is applied automatically</div>
                                        <div style="font-size: 0.78rem; color: var(--accent); font-weight: 700; margin-top: 6px;"
                                            v-if="uploadingMedia">Uploading and optimizing image...</div>
                                        <input type="file" ref="fileInput" style="display: none;"
                                            accept="image/*,video/*" @change="handleFileSelect">
                                    </div>
                                </div>

                                <div class="form-group form-full">
                                    <label>Product Image URL (Auto-filled on upload)</label>
                                    <input type="url" v-model="newProduct.image"
                                        placeholder="https://pesado585.com/.../img.png">
                                </div>
                                <div class="form-group form-full">
                                    <label>Original Product Manufacturer Link</label>
                                    <input type="url" v-model="newProduct.original_link"
                                        placeholder="https://pesado585.com/products/self-leveling-tamper">
                                </div>
                                <div class="form-group form-full">
                                    <label>Short Description (for homepage card)</label>
                                    <textarea v-model="newProduct.description" rows="2"
                                        placeholder="Brief summary of the precision tool..."></textarea>
                                </div>
                                <div class="form-group form-full">
                                    <label>Detailed Marketing Description (for product drawer)</label>
                                    <textarea v-model="newProduct.long_description" rows="4"
                                        placeholder="Full sales copywriting copy..."></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Key Features (One feature per line)</label>
                                    <textarea v-model="newProduct.features" rows="4"
                                        placeholder="Feature 1: Detail&#10;Feature 2: Detail"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Machine Compatibility (One model per line)</label>
                                    <textarea v-model="newProduct.compatibility" rows="4"
                                        placeholder="Breville 54mm&#10;Commercial E61 group heads"></textarea>
                                </div>
                                <div class="form-group form-full" style="margin-top: 10px;">
                                    <button type="submit" class="btn">Add Product to Catalog</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Direct Shopify Catalog Importer -->
                    <div class="panel" style="margin-top: 24px;">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                Shopify Catalog Quick Importer
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5" style="color: var(--text-muted);">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </h3>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <select v-model="shopifyImportBrandId"
                                    style="width: 180px; font-weight: 600; border-radius: 8px;">
                                    <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                                </select>
                                <button type="button" class="btn" @click="scanShopifyProducts">Scan Shopify
                                    Catalog</button>
                            </div>
                        </div>

                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;"
                            v-if="shopifyScanStatus">
                            {{ shopifyScanStatus }}
                        </div>

                        <div
                            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
                            <div v-for="p in shopifyProducts" :key="p.id" class="metric-card"
                                style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; gap: 12px;">
                                    <img :src="p.image || 'https://placehold.co/100'"
                                        style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border);"
                                        alt="Product Thumbnail">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">{{
                                            p.title }}</div>
                                        <div
                                            style="font-weight: 700; font-size: 0.95rem; color: var(--accent); margin-top: 4px;">
                                            €{{ parseFloat(p.price).toFixed(2) }}</div>
                                    </div>
                                </div>
                                <p
                                    style="color: var(--text-muted); font-size: 0.78rem; line-height: 1.4; max-height: 48px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                    {{ p.description.replace(/<[^>]*>/g, '') }}
                                </p>
                                <button type="button" class="btn"
                                    style="width: 100%; font-size: 0.8rem; padding: 6px 12px; margin-top: auto; height: 32px;"
                                    @click="importShopifyProduct($event, p)">
                                    Import to Catalog
                                </button>
                            </div>

                            <div v-if="shopifyProducts.length === 0"
                                style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 10px; border: 1px dashed var(--border); border-radius: 8px;">
                                Select a brand store above and click "Scan Shopify Catalog" to fetch live items.
                            </div>
                        </div>
                    </div>

                    <!-- Current Product Catalog Management Table -->
                    <div class="panel" style="margin-top: 24px;">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                Current Product Catalog
                                <span
                                    style="font-size: 0.72rem; background: var(--bg-color); color: var(--text-main); padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-left: 6px;">
                                    {{ filteredProducts.length }} items
                                </span>
                            </h3>
                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <div class="header-search-container" style="width: 220px;">
                                    <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2.5">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input type="text" class="header-search-input" placeholder="Search catalog..."
                                        v-model="productsSearchQuery"
                                        style="padding: 6px 12px 6px 32px; height: 32px; line-height: 32px;">
                                </div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product Info</th>
                                        <th>Brand Shop</th>
                                        <th>Price</th>
                                        <th>Badge Tag</th>
                                        <th>Compatibility</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="prod in searchedProducts" :key="prod.id">
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <img :src="prod.image || 'https://placehold.co/100'"
                                                    style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border);"
                                                    alt="Product Image">
                                                <div>
                                                    <strong style="color: var(--text-main);">{{ prod.title }}</strong>
                                                    <div
                                                        style="font-size: 0.75rem; color: var(--text-muted); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                        {{ prod.description || 'No description provided.' }}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="status-pill"
                                                style="background: var(--bg-color); color: var(--text-main); font-weight: 600;">
                                                {{ getBrandName(prod.brand_id) }}
                                            </span>
                                        </td>
                                        <td><strong>€{{ parseFloat(prod.price).toFixed(2) }}</strong></td>
                                        <td>
                                            <span class="status-pill"
                                                style="background: rgba(211, 179, 120, 0.15); color: var(--accent); font-weight: 600;"
                                                v-if="prod.tag">
                                                {{ prod.tag }}
                                            </span>
                                            <span v-else style="color: var(--text-muted); font-size: 0.8rem;">—</span>
                                        </td>
                                        <td>
                                            <div
                                                style="font-size: 0.78rem; color: var(--text-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                {{ getCompatibility(prod) }}
                                            </div>
                                        </td>
                                        <td>
                                            <button type="button" class="btn"
                                                style="background: #ef4444; border-color: #ef4444; color: #ffffff; padding: 4px 10px; font-size: 0.75rem; height: 28px; font-weight: 700;"
                                                @click="deleteProduct(prod.id)">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="searchedProducts.length === 0">
                                        <td colspan="6"
                                            style="text-align: center; color: var(--text-muted); padding: 30px;">
                                            No products match the selected filters or search parameters.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- VIEW 4: COMBINED ORDERS -->
                <div id="view-orders" class="admin-view" :class="{ active: activeView === 'orders' }">
                    <div class="panel">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                Recent Transactions
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5" style="color: var(--text-muted);">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </h3>
                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <div class="header-search-container" style="width: 220px;">
                                    <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2.5">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input type="text" class="header-search-input" placeholder="Search transactions..."
                                        v-model="ordersSearchQuery"
                                        style="padding: 6px 12px 6px 32px; height: 32px; line-height: 32px;">
                                </div>
                                <button class="pill-btn"
                                    @click="triggerUpcoming('Transactions Ledger Creator', 'Manually inject transactions.')"
                                    style="height: 32px; padding: 0 12px;">+ Add Transaction</button>
                                <button class="action-dots-btn">···</button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th class="checkbox-cell">
                                            <div class="checkbox-custom"></div>
                                        </th>
                                        <th><span class="sort-header">ID ↕</span></th>
                                        <th><span class="sort-header">Customer ↕</span></th>
                                        <th>Product</th>
                                        <th>Status</th>
                                        <th><span class="sort-header">Qty ↕</span></th>
                                        <th><span class="sort-header">Unit Price ↕</span></th>
                                        <th><span class="sort-header">Total Revenue ↕</span></th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="order in searchedOrders" :key="order.id">
                                        <td class="checkbox-cell">
                                            <div class="checkbox-custom"></div>
                                        </td>
                                        <td><strong>#{{ order.id.slice(0, 5) }}</strong>
                                            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                                                {{ formatDate(order.created_at) }}</div>
                                        </td>
                                        <td>
                                            <div><strong>{{ order.customer_name }}</strong></div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">{{
                                                order.customer_email }}</div>
                                        </td>
                                        <td>{{ getOrderProductTitle(order) }}</td>
                                        <td>
                                            <span class="status-pill" :class="getStatusClass(order.status)">{{
                                                getStatusLabel(order.status) }}</span>
                                        </td>
                                        <td>{{ getOrderQty(order) }}</td>
                                        <td>€{{ getOrderUnitPrice(order) }}</td>
                                        <td><strong>€{{ parseFloat(order.total).toFixed(2) }}</strong></td>
                                        <td>
                                            <button class="action-dots-btn">···</button>
                                        </td>
                                    </tr>
                                    <tr v-if="searchedOrders.length === 0">
                                        <td colspan="9"
                                            style="text-align: center; color: var(--text-muted); padding: 30px;">No
                                            transactions logged.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- VIEW 5: WAREHOUSE SIMULATOR LAUNCHER -->
                <div id="view-warehouse-sim" class="admin-view" :class="{ active: activeView === 'warehouse-sim' }">
                    <div class="panel" style="max-width: 600px;">
                        <h3 class="panel-title">Fulfillment Warehouse Simulator</h3>
                        <p
                            style="color: var(--text-muted); font-size: 0.88rem; margin: 8px 0 20px 0; line-height: 1.5;">
                            Select an onboarded brand store below to launch its dedicated Shopify simulated fulfillment
                            warehouse.
                        </p>
                        <div class="form-grid" style="grid-template-columns: 1fr;">
                            <div class="form-group">
                                <label>Select Brand Store</label>
                                <select v-model="simBrandId" required>
                                    <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-top: 10px;">
                                <button type="button" class="btn" @click="launchWarehouseSimulator">
                                    Launch Warehouse Simulator ↗
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- VIEW 6: INTEGRATION SETTINGS -->
                <div id="view-settings" class="admin-view" :class="{ active: activeView === 'settings' }">
                    <!-- Global configs -->
                    <div class="panel" v-if="userRole.toLowerCase() === 'superadmin'">
                        <h3 class="panel-title">Global Stripe & API Settings</h3>
                        <form @submit.prevent style="margin-top: 15px;">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Stripe Integration Mode</label>
                                    <select id="global-stripe-mode">
                                        <option value="test">Sandbox / Testing (Custom Stripe checks)</option>
                                        <option value="live">Live / Production (Direct Stripe redirection)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Max Upload Image Size (Resized width px)</label>
                                    <input type="number" id="global-image-rules" value="800">
                                </div>
                                <div class="form-group form-full">
                                    <label>Global API Webhook Logs Path</label>
                                    <input type="text" id="global-webhook-logs" readonly
                                        value="/var/log/sc-api-webhooks.log">
                                </div>
                                <div class="form-group form-full">
                                    <button type="button" class="btn"
                                        @click="showNotification('Global integrations updated.')">Save Global
                                        Configurations</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Contextual settings for currently filtered shop -->
                    <div class="panel" id="shop-settings-panel" v-if="activeShopFilter !== 'all'">
                        <h3 class="panel-title">Shop Settings for <span>{{ currentSelectedBrandName }}</span></h3>
                        <form @submit.prevent="updateBrandSettings" style="margin-top: 15px;">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Display Name</label>
                                    <input type="text" v-model="settingsBrand.name" required>
                                </div>
                                <div class="form-group">
                                    <label>Host Subdomain</label>
                                    <input type="text" v-model="settingsBrand.subdomain" required>
                                </div>
                                <div class="form-group">
                                    <label>Contact Email</label>
                                    <input type="email" v-model="settingsBrand.contact_email" required>
                                </div>
                                <div class="form-group">
                                    <label>Custom Accent Color</label>
                                    <input type="text" v-model="settingsBrand.primary_color" required>
                                </div>
                                <div class="form-group">
                                    <label>Manual Custom Domain (Optional)</label>
                                    <input type="text" v-model="settingsBrand.custom_domain"
                                        placeholder="coffee-brandsite.com">
                                </div>
                                <div class="form-group">
                                    <label>Favicon Icon URL (Optional)</label>
                                    <input type="text" v-model="settingsBrand.favicon"
                                        placeholder="https://pesado585.com/favicon.ico">
                                </div>
                                <div class="form-group">
                                    <label>Logo Image URL (Optional)</label>
                                    <input type="text" v-model="settingsBrand.logo"
                                        placeholder="https://pesado585.com/logo.png">
                                </div>
                                <div class="form-group form-full">
                                    <label>Shopify Store URL (for asset scraping & sync)</label>
                                    <input type="text" v-model="settingsBrand.shopify_shop_name">
                                </div>
                                <div class="form-group form-full">
                                    <label>Shopify Access Token</label>
                                    <input type="password" v-model="settingsBrand.shopify_access_token"
                                        placeholder="Shopify Access Token (shpat_...)">
                                </div>
                                <div class="form-group">
                                    <label>Stripe Secret Key</label>
                                    <input type="password" v-model="settingsBrand.stripe_secret_key"
                                        placeholder="Stripe Secret Key (sk_live_...)">
                                </div>
                                <div class="form-group">
                                    <label>Stripe Webhook Secret</label>
                                    <input type="password" v-model="settingsBrand.stripe_webhook_secret"
                                        placeholder="Stripe Webhook Secret (whsec_...)">
                                </div>
                                <div class="form-group form-full">
                                    <button type="submit" class="btn">Update Shop Integrations</button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="panel" id="no-shop-selected-settings" v-if="activeShopFilter === 'all'"
                        style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                        <p>⚠️ Select a specific Shop Context in the top bar to configure individual integrations and
                            Shopify parameters.</p>
                    </div>
                </div>

                <!-- VIEW 7: HELP CENTER / MANUAL -->
                <div id="view-help" class="admin-view" :class="{ active: activeView === 'help' }">
                    <div class="panel">
                        <h3 class="panel-title" style="margin-bottom: 20px;">Shopify Integration Manual & Guidelines
                        </h3>
                        <div id="help-content-markdown"
                            style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);"
                            v-html="helpManualHtml"></div>
                    </div>
                </div>

                <!-- VIEW 8: CUSTOMERS LIST (CRM) -->
                <div id="view-customers" class="admin-view" :class="{ active: activeView === 'customers' }">
                    <div class="panel">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                Customer Directory
                                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-left: 8px;">
                                    {{ searchedCustomers.length }} customers recorded
                                </span>
                            </h3>
                            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <div class="header-search-container" style="width: 220px; position: relative;">
                                    <svg class="header-search-icon" width="12" height="12" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2.5"
                                        style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input type="text" class="header-search-input" placeholder="Search customers..."
                                        v-model="customerSearchQuery"
                                        style="padding: 6px 12px 6px 30px; height: 36px; line-height: 36px; border: 1px solid var(--border); border-radius: 8px; width: 100%; background: var(--card-bg); color: var(--text-main); font-size: 0.82rem;">
                                </div>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Brand Channel</th>
                                        <th style="text-align: center;">Orders Count</th>
                                        <th style="text-align: right;">Total Spent (CLV)</th>
                                        <th style="text-align: right;">Latest Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="c in searchedCustomers" :key="c.email">
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div class="workspace-dropdown-avatar" style="width: 32px; height: 32px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--border); color: var(--text-main);">
                                                    {{ c.name.charAt(0).toUpperCase() }}
                                                </div>
                                                <div>
                                                    <strong style="color: var(--text-main); font-size: 0.88rem; display: block;">{{ c.name }}</strong>
                                                    <span style="color: var(--text-muted); font-size: 0.78rem;">{{ c.email }}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge-simulation" style="font-size: 0.72rem; padding: 3px 8px; background: var(--border); color: var(--text-main); border-radius: 4px; text-transform: uppercase;">
                                                {{ c.brand_id }}
                                            </span>
                                        </td>
                                        <td style="text-align: center; font-weight: 600;">{{ c.ordersCount }}</td>
                                        <td style="text-align: right; font-weight: 700; color: var(--success);">
                                            €{{ c.totalSpent.toFixed(2) }}
                                        </td>
                                        <td style="text-align: right; color: var(--text-muted); font-size: 0.82rem;">
                                            {{ formatDate(c.lastOrderDate) }}
                                        </td>
                                    </tr>
                                    <tr v-if="searchedCustomers.length === 0">
                                        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">
                                            No customers found matching search parameters.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
        </main>

        <!-- LIVE SEARCH OVERLAY MODAL (⌘ K) -->
        <div class="search-modal" v-if="searchModalOpen" @click="closeSearchModal">
            <div class="search-modal-container" @click.stopPropagation>
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
                <div class="search-modal-results">
                    <div v-if="!searchQuery.trim()"
                        style="text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 30px 10px;">
                        Type to search catalog items...</div>

                    <div v-if="searchQuery.trim()">
                        <div v-if="matchingSearchShops.length > 0">
                            <div
                                style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 8px 0;">
                                Brand Shops</div>
                            <div v-for="shop in matchingSearchShops" :key="shop.id" class="search-item"
                                @click="selectSearchShop(shop.id)">
                                <div><strong>{{ shop.name }}</strong> <span
                                        style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">({{
                                        shop.subdomain }})</span></div>
                                <span style="font-size: 0.8rem; color: var(--accent);">Integrations Settings ↗</span>
                            </div>
                        </div>

                        <div v-if="matchingSearchOrders.length > 0">
                            <div
                                style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin: 16px 0 8px 0;">
                                Transactions / Orders</div>
                            <div v-for="ord in matchingSearchOrders" :key="ord.id" class="search-item"
                                @click="selectSearchOrder(ord.id)">
                                <div><strong>{{ ord.id }}</strong> <span
                                        style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">({{
                                        ord.customer_name }})</span></div>
                                <span class="status-badge status-success"
                                    style="font-size: 0.7rem; padding: 2px 6px;">€{{ parseFloat(ord.total).toFixed(2)
                                    }}</span>
                            </div>
                        </div>

                        <div v-if="matchingSearchShops.length === 0 && matchingSearchOrders.length === 0"
                            style="text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 30px 10px;">
                            No matching results found in system catalog.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- UPCOMING ROADMAPPED BETA FEATURES OVERLAY MODAL -->
        <div class="upcoming-modal" v-if="upcomingModal.open" @click="closeUpcomingModal">
            <div class="upcoming-card" @click.stopPropagation>
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

        <!-- Toast message notification -->
        <div class="toast" :class="{ show: toastMessage }">
            <span style="color: var(--text-main); font-weight: bold; font-size: 1.1rem;">✔</span>
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">{{ toastMessage }}</span>
        </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const envConfigs = {
    local: '',
    dev: 'https://dev-api.stricktlycoffee.be',
    prod: 'https://api.stricktlycoffee.be'
};

export default {
            data() {
                return {
                    activeView: 'overview',
                    currentEnv: 'local',
                    activeShopFilter: 'all',
                    workspaceDropdownOpen: false,
                    productsSearchQuery: '',
                    customerSearchQuery: '',

                    // Datasets
                    brands: [],
                    orders: [],
                    products: [],

                    // Auth state
                    isLoggedIn: false,
                    loginEmail: 'sc@davidblaesing.com',
                    loginPassword: 'TheKey4u',
                    loginError: '',
                    userRole: 'Superadmin',

                    // Forms
                    newBrand: {
                        id: '',
                        name: '',
                        subdomain: '',
                        contact_email: '',
                        primary_color: '#c5a059',
                        shopify_shop_name: '',
                        shopify_access_token: '',
                        stripe_secret_key: '',
                        stripe_webhook_secret: '',
                        custom_domain: '',
                        logo: '',
                        favicon: ''
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
                        compatibility: ''
                    },
                    settingsBrand: {
                        id: '',
                        name: '',
                        subdomain: '',
                        contact_email: '',
                        primary_color: '#c5a059',
                        shopify_shop_name: '',
                        shopify_access_token: '',
                        stripe_secret_key: '',
                        stripe_webhook_secret: '',
                        custom_domain: '',
                        logo: '',
                        favicon: ''
                    },

                    // Shopify Importer
                    shopifyImportBrandId: '',
                    shopifyProducts: [],
                    shopifyScanStatus: '',

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

                    // Sidebar drawer responsive state
                    mobileSidebarOpen: false,

                    // UI Toast Notification
                    toastMessage: '',

                    // Loading progress
                    uploadingMedia: false,
                    helpManualHtml: 'Loading onboarding guidelines...'
                };
            },
            computed: {
                activeWorkspaceLetter() {
                    if (this.activeShopFilter === 'all') return 'S';
                    const brand = this.brands.find(b => b.id === this.activeShopFilter);
                    return brand ? brand.name.charAt(0).toUpperCase() : 'S';
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
                    return brand ? `${brand.subdomain}.stricktlycoffee.be` : 'Custom Workspace';
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
                                lastOrderDate: o.created_at
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
                    const hostPrefix = brand.subdomain.split('.')[0];
                    if (this.currentEnv === 'local') {
                        return `http://${hostPrefix}.stricktlycoffee.local?previewBrandId=${this.previewActiveBrandId}`;
                    } else {
                        const domain = brand.custom_domain ? brand.custom_domain : `${hostPrefix}.stricktlycoffee.be`;
                        return `https://${domain}?previewBrandId=${this.previewActiveBrandId}`;
                    }
                },
                apiBaseUrl() {
                    return envConfigs[this.currentEnv];
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
                    return this.activeView.charAt(0).toUpperCase() + this.activeView.slice(1);
                },
                // Filtering transactions database
                filteredOrders() {
                    if (this.activeShopFilter === 'all') {
                        return this.orders;
                    }
                    return this.orders.filter(o => o.brand_id === this.activeShopFilter);
                },
                calculatedConversionRate() {
                    if (this.filteredOrders.length === 0) return '3.9';
                    const paid = this.filteredOrders.filter(o => o.status !== 'pending_payment').length;
                    return ((paid / (this.filteredOrders.length * 15)) * 100).toFixed(1);
                },
                uniqueCustomersCount() {
                    const emails = this.filteredOrders.map(o => o.customer_email).filter(Boolean);
                    return [...new Set(emails)].length;
                },
                formattedSalesTotal() {
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
                    return this.brands.filter(b => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
                },
                matchingSearchOrders() {
                    if (!this.searchQuery.trim()) return [];
                    const q = this.searchQuery.toLowerCase();
                    return this.orders.filter(o =>
                        (o.id && o.id.toLowerCase().includes(q)) ||
                        (o.customer_name && o.customer_name.toLowerCase().includes(q))
                    );
                }
            },
            watch: {
                activeShopFilter(newVal) {
                    this.updateSettingsContext();
                },
                filteredOrders(newVal) {
                    this.renderAnalyticsCharts();
                }
            },
            mounted() {
                // Initialize environment variables
                const savedEnv = localStorage.getItem('sc_admin_env');
                if (savedEnv) {
                    this.currentEnv = savedEnv;
                }

                // Verify Auth session
                const token = localStorage.getItem('sc_admin_token');
                const role = localStorage.getItem('sc_admin_role');
                const brandId = localStorage.getItem('sc_admin_brand_id');
                if (token) {
                    this.isLoggedIn = true;
                    if (role) this.userRole = role;
                    this.activeShopFilter = brandId || 'all';
                    this.bootDashboard();
                }

                // Setup global key listener for ⌘ K and click outside
                window.addEventListener('keydown', this.handleGlobalKeydowns);
                document.addEventListener('click', this.handleDocumentClick);
            },
            unmounted() {
                window.removeEventListener('keydown', this.handleGlobalKeydowns);
                document.removeEventListener('click', this.handleDocumentClick);
            },
            methods: {
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
                handleDocumentClick(e) {
                    if (this.workspaceDropdownOpen) {
                        const selector = this.$el.querySelector('.profile-selector-btn');
                        const menu = this.$el.querySelector('.workspace-dropdown-menu');
                        if (selector && !selector.contains(e.target) && menu && !menu.contains(e.target)) {
                            this.workspaceDropdownOpen = false;
                        }
                    }
                },
                selectWorkspace(id) {
                    this.workspaceDropdownOpen = false;
                    if (id === 'create') {
                        this.activeView = 'brands';
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
                            if (result.brand_id) {
                                localStorage.setItem('sc_admin_brand_id', result.brand_id);
                            } else {
                                localStorage.removeItem('sc_admin_brand_id');
                            }

                            this.userRole = result.role;
                            this.activeShopFilter = result.brand_id || 'all';
                            this.isLoggedIn = true;
                            this.showNotification('Authentication successful.');
                            this.bootDashboard();
                        } else {
                            this.loginError = 'Invalid credentials. Please try again.';
                        }
                    } catch (err) {
                        this.loginError = `Server connection refused: ${err.message}`;
                    }
                },
                handleLogout() {
                    if (confirm('Log out of Enterprise Portal?')) {
                        localStorage.removeItem('sc_admin_token');
                        localStorage.removeItem('sc_admin_email');
                        localStorage.removeItem('sc_admin_role');
                        localStorage.removeItem('sc_admin_brand_id');
                        this.isLoggedIn = false;
                        this.loginPassword = '';
                    }
                },
                changeEnvironment() {
                    localStorage.setItem('sc_admin_env', this.currentEnv);
                    this.showNotification(`Target environment updated to ${this.currentEnv.toUpperCase()}`);
                    this.bootDashboard();
                },
                bootDashboard() {
                    this.loadBrands();
                    this.loadOrders();
                    this.loadProducts();
                },
                switchView(viewId) {
                    this.activeView = viewId;
                    this.mobileSidebarOpen = false;

                    if (viewId === 'overview' || viewId === 'products' || viewId === 'warehouse-sim' || viewId === 'customers') {
                        this.loadBrands();
                    }
                    if (viewId === 'products') {
                        this.loadProducts();
                    }
                    if (viewId === 'orders' || viewId === 'overview' || viewId === 'customers') {
                        this.loadOrders();
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
                // Fetch Brands List
                async loadBrands() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/brands`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (!response.ok) throw new Error();
                        this.brands = await response.json();

                        // Default onboarding select option
                        if (this.brands.length > 0) {
                            if (!this.newProduct.brand_id) this.newProduct.brand_id = this.brands[0].id;
                            if (!this.shopifyImportBrandId) this.shopifyImportBrandId = this.brands[0].id;
                            if (!this.simBrandId) this.simBrandId = this.brands[0].id;
                            if (!this.previewActiveBrandId) this.previewActiveBrandId = this.brands[0].id;
                        }
                    } catch (err) {
                        console.error('Failed to load brands:', err);
                    }
                },
                // Fetch Orders List
                async loadOrders() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/orders`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (!response.ok) throw new Error();
                        this.orders = await response.json();
                        nextTick(() => {
                            this.renderAnalyticsCharts();
                        });
                    } catch (err) {
                        console.error('Failed to load orders:', err);
                    }
                },
                // Fetch Products List
                async loadProducts() {
                    try {
                        const response = await fetch(`${this.apiBaseUrl}/api/global/products`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('sc_admin_token')}` }
                        });
                        if (!response.ok) throw new Error();
                        this.products = await response.json();
                    } catch (err) {
                        console.error('Failed to load products:', err);
                    }
                },
                fetchProducts() {
                    return this.loadProducts();
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
                            this.newBrand = { id: '', name: '', subdomain: '', contact_email: '', primary_color: '#c5a059', shopify_shop_name: '', shopify_access_token: '', stripe_secret_key: '', stripe_webhook_secret: '', custom_domain: '', logo: '', favicon: '' };
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
                            this.loadBrands();
                        } else {
                            const err = await response.json();
                            alert(`Error de-onboarding: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
                    }
                },
                // Add Product manual
                async addProduct() {
                    const features = this.newProduct.features.split('\n').filter(l => l.trim() !== '');
                    const compatibility = this.newProduct.compatibility.split('\n').filter(l => l.trim() !== '');

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
                            this.newProduct = { brand_id: this.brands[0]?.id || '', title: '', price: 132.00, tag: '', image: '', original_link: '', description: '', long_description: '', features: '', compatibility: '' };
                        } else {
                            const err = await response.json();
                            alert(`Error adding product: ${err.error}`);
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
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
                            this.settingsBrand = {
                                ...brand,
                                shopify_access_token: '',
                                stripe_secret_key: '',
                                stripe_webhook_secret: ''
                            };
                        }
                    }
                },
                async updateBrandSettings() {
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
                            this.loadBrands();
                        } else {
                            alert('Error updating integrations.');
                        }
                    } catch (err) {
                        alert(`Error: ${err.message}`);
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
                        const domain = brand.custom_domain ? brand.custom_domain : `${brand.subdomain}.stricktlycoffee.be`;
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
                // Rendering Sales and Category Trends charts
                renderAnalyticsCharts() {
                    const paid = this.filteredOrders.filter(o => o.status !== 'pending_payment');

                    const labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    const newUsersData = Array(12).fill(0);
                    const existingUsersData = Array(12).fill(0);

                    paid.forEach(o => {
                        const date = new Date(o.created_at);
                        const mIdx = date.getMonth();
                        const total = parseFloat(o.total) || 0;
                        newUsersData[mIdx] += total * 0.65;
                        existingUsersData[mIdx] += total * 0.35;
                    });

                    const hasData = newUsersData.some(v => v > 0);
                    if (!hasData) {
                        newUsersData.splice(0, 12, 10000, 14000, 17000, 12000, 20000, 38000, 24000, 18000, 16000, 21000, 14000, 17000);
                        existingUsersData.splice(0, 12, 6000, 8000, 10000, 6000, 11000, 18000, 12000, 9000, 8000, 10000, 6000, 8000);
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
                        window.salesChartInstance = new Chart(ctxSales, {
                            type: 'bar',
                            data: {
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'New User',
                                        data: newUsersData,
                                        backgroundColor: newUsersColor,
                                        borderRadius: 4,
                                        barThickness: 16
                                    },
                                    {
                                        label: 'Existing User',
                                        data: existingUsersData,
                                        backgroundColor: existingUsersColor,
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
                                        stacked: true,
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
                                        stacked: true,
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
                    if (dataBrands.length === 0 || dataBrands.every(v => v === 0)) {
                        labelsBrands.splice(0, 12, 'Espresso', 'Accessories', 'Filter Tools', 'Cleaning');
                        dataBrands.splice(0, 12, 14200, 9800, 7500, 5200);
                    }

                    const canvasFunnel = document.getElementById('funnelChart');
                    if (canvasFunnel) {
                        const ctxFunnel = canvasFunnel.getContext('2d');
                        if (window.funnelChartInstance) {
                            window.funnelChartInstance.destroy();
                        }
                        window.funnelChartInstance = new Chart(ctxFunnel, {
                            type: 'bar',
                            data: {
                                labels: labelsBrands,
                                datasets: [{
                                    data: dataBrands,
                                    backgroundColor: existingUsersColor,
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
</style>
