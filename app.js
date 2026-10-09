/* -------------------------------------------------------------------------- */
/* ServTec OS - Multi-Device Cloud Engine                                     */
/* -------------------------------------------------------------------------- */

// Global State
let state = {
    orders: [],
    inventory: [],
    finances: [],
    cart: [],
    currentTab: 'dashboard',
    terminalRole: 'admin',
    ordersViewMode: 'kanban',
    inventoryCategoryFilter: 'all',
    posCategoryFilter: 'all',
    ownerPhone: '+51987654321'
};

// BroadcastChannel for Realtime Sync
const syncChannel = new BroadcastChannel('servtec_sync_channel');

// Initial Mock Seed Data
const initialSeedData = {
    inventory: [
        { id: 'inv-1', sku: 'REP-SAM-A54', name: 'Pantalla Samsung A54 5G OLED', category: 'repuestos', priceCost: 45.00, priceSale: 95.00, stock: 4, minStock: 2 },
        { id: 'inv-2', sku: 'REP-IPH-13', name: 'Pantalla iPhone 13 Incell', category: 'repuestos', priceCost: 65.00, priceSale: 130.00, stock: 2, minStock: 2 },
        { id: 'inv-3', sku: 'REP-PIN-TYPEC', name: 'Pin de Carga Universal Type-C', category: 'repuestos', priceCost: 2.50, priceSale: 25.00, stock: 1, minStock: 3 },
        { id: 'inv-4', sku: 'REP-BAT-IPH11', name: 'Batería iPhone 11 (3110mAh)', category: 'repuestos', priceCost: 18.00, priceSale: 45.00, stock: 5, minStock: 2 },
        { id: 'inv-5', sku: 'POS-MIC-GEL', name: 'Mica de Hidrogel UV Universal', category: 'accesorios', priceCost: 1.20, priceSale: 8.00, stock: 18, minStock: 5 },
        { id: 'inv-6', sku: 'POS-MIC-9D', name: 'Mica de Vidrio Templado 9D', category: 'accesorios', priceCost: 0.80, priceSale: 5.00, stock: 25, minStock: 5 },
        { id: 'inv-7', sku: 'POS-CAR-33W', name: 'Cargador Carga Rápida 33W', category: 'cargadores', priceCost: 5.50, priceSale: 15.00, stock: 6, minStock: 2 },
        { id: 'inv-8', sku: 'POS-FUN-SIL', name: 'Funda Silicona Antigolpes', category: 'fundas', priceCost: 1.50, priceSale: 7.00, stock: 12, minStock: 3 }
    ],
    orders: [
        {
            id: 'ORD-1001',
            clientName: 'Carlos Mendoza',
            clientPhone: '+51 987654321',
            deviceModel: 'Samsung A54 5G',
            imei: '869482049301293',
            passCode: '1234',
            checklist: { prende: true, tactil: false, camaras: true, audio: true, carga: true, sim: true },
            faultDescription: 'Pantalla Rota por caída. No da imagen.',
            partSourceType: 'existing',
            partId: 'inv-1',
            partName: 'Pantalla Samsung A54 5G OLED',
            partCost: 45.00,
            totalCost: 95.00,
            advancePayment: 30.00,
            status: 'en_reparacion',
            date: new Date(Date.now() - 3600000 * 4).toISOString()
        }
    ],
    finances: [
        {
            id: 'fin-1',
            date: new Date(Date.now() - 3600000 * 24).toISOString(),
            type: 'ingreso_servicio',
            ref: 'Adelanto #ORD-1001 (Carlos Mendoza)',
            method: 'Efectivo',
            income: 30.00,
            cost: 0.00,
            netProfit: 30.00
        }
    ]
};

// Application Init
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    initEventListeners();
    initMultiDeviceSync();
    updateDateDisplay();
    renderAllViews();
});

// Storage Engine
function loadDatabase() {
    const localInv = localStorage.getItem('servtec_inventory');
    const localOrd = localStorage.getItem('servtec_orders');
    const localFin = localStorage.getItem('servtec_finances');
    const localOwnerPhone = localStorage.getItem('servtec_owner_phone');

    state.inventory = localInv ? JSON.parse(localInv) : initialSeedData.inventory;
    state.orders = localOrd ? JSON.parse(localOrd) : initialSeedData.orders;
    state.finances = localFin ? JSON.parse(localFin) : initialSeedData.finances;
    if (localOwnerPhone) state.ownerPhone = localOwnerPhone;

    saveDatabase(false);
}

function saveDatabase(broadcast = true) {
    localStorage.setItem('servtec_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('servtec_orders', JSON.stringify(state.orders));
    localStorage.setItem('servtec_finances', JSON.stringify(state.finances));
    localStorage.setItem('servtec_owner_phone', state.ownerPhone);

    if (broadcast) {
        syncChannel.postMessage({ type: 'sync_update', timestamp: Date.now() });
    }
}

// Multi-Device Realtime Sync Setup
function initMultiDeviceSync() {
    syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'sync_update') {
            loadDatabase();
            renderAllViews();
            showToast('🔄 Sincronizado en tiempo real.', 'info');
        }
    };

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('servtec_')) {
            loadDatabase();
            renderAllViews();
        }
    });
}

// QR Connect Modal (Cloud Ready & Instant iPhone Compatible)
function openQrConnectModal() {
    // Uses full cloud or current URL automatically
    const cloudUrl = window.location.origin + window.location.pathname;
    updateQrView(cloudUrl);
    openModal('modal-qr-connect');
}

function updateQrView(url) {
    const qrImg = document.getElementById('qr-code-img');
    const urlText = document.getElementById('qr-url-text');

    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
    }
    if (urlText) {
        urlText.textContent = url;
    }
}

function copyQrUrl() {
    const urlText = document.getElementById('qr-url-text')?.textContent || window.location.href;
    navigator.clipboard.writeText(urlText).then(() => {
        showToast('¡Enlace copiado!', 'success');
    }).catch(() => {
        showToast(`Enlace: ${urlText}`, 'info');
    });
}

// WhatsApp Direct Low-Stock Alert to Owner
function sendLowStockWhatsApp() {
    const criticalItems = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock));

    if (criticalItems.length === 0) {
        showToast('¡Inventario normal! No hay repuestos con stock crítico.', 'success');
        return;
    }

    let targetPhone = prompt("Ingresa tu número de WhatsApp para recibir el reporte (con código de país, ej. +51987654321):", state.ownerPhone);
    if (!targetPhone) return;

    state.ownerPhone = targetPhone;
    saveDatabase(false);

    const phoneClean = targetPhone.replace(/[^0-9]/g, '');

    let msg = `🚨 *ALERTA DE STOCK BAJO - SERVTEC OS* 🚨\n`;
    msg += `_Reporte de repuestos/productos por agotarse (<=2 uds):_\n\n`;

    criticalItems.forEach((item, index) => {
        msg += `${index + 1}. 📦 *${item.name}*\n`;
        msg += `   Stock: *${item.stock} uds* (Alerta Mín: ${item.minStock})\n`;
        msg += `   Costo Ref: $${item.priceCost}\n\n`;
    });

    msg += `📌 _Por favor realizar pedido al proveedor a la brevedad._`;

    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// Terminal Role Switcher
function changeTerminalRole(role) {
    state.terminalRole = role;
    const label = document.getElementById('user-role-label');
    const hint = document.getElementById('role-hint-text');

    const navDashboard = document.getElementById('nav-btn-dashboard');
    const navInventory = document.getElementById('nav-btn-inventory');
    const navFinances = document.getElementById('nav-btn-finances');
    const navPos = document.getElementById('nav-btn-pos');

    if (role === 'admin') {
        if (label) label.textContent = 'Administrador General';
        if (hint) hint.textContent = 'Acceso completo a todos los módulos';
        [navDashboard, navInventory, navFinances, navPos].forEach(el => el?.classList.remove('hidden'));
        switchTab('dashboard');
    } else if (role === 'reception') {
        if (label) label.textContent = 'Recepción / Caja';
        if (hint) hint.textContent = 'Foco en recepción de equipos y ventas POS';
        navFinances?.classList.add('hidden');
        navDashboard?.classList.remove('hidden');
        navInventory?.classList.remove('hidden');
        navPos?.classList.remove('hidden');
        switchTab('orders');
    } else if (role === 'tech') {
        if (label) label.textContent = 'Taller / Técnico';
        if (hint) hint.textContent = 'Foco en tablero Kanban de reparaciones y repuestos';
        navFinances?.classList.add('hidden');
        navPos?.classList.add('hidden');
        navDashboard?.classList.remove('hidden');
        navInventory?.classList.remove('hidden');
        switchTab('orders');
    }

    showToast(`Modo de Terminal cambiado a: ${role.toUpperCase()}`, 'success');
}

function toggleMobileSidebar(forceState) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const appContainer = document.getElementById('app-container');
    if (!sidebar) return;

    const shouldOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
    if (shouldOpen) {
        sidebar.classList.add('open');
        overlay?.classList.add('active');
        appContainer?.classList.remove('sidebar-collapsed');
    } else {
        sidebar.classList.remove('open');
        overlay?.classList.remove('active');
        appContainer?.classList.add('sidebar-collapsed');
    }
}

// Event Listeners
function initEventListeners() {
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        toggleMobileSidebar();
    });

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
            if (window.innerWidth <= 1024) {
                toggleMobileSidebar(false);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('global-search')?.focus();
        }
    });

    document.getElementById('global-search')?.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (val) {
            switchTab('orders');
            document.getElementById('order-search-input').value = val;
            renderOrders();
        }
    });
}

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateSpan = document.getElementById('current-date-display');
    if (dateSpan) dateSpan.textContent = now.toLocaleDateString('es-ES', options);
}

// Navigation Engine
function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabId}`);
    const targetNav = document.querySelector(`.sidebar-nav .nav-item[data-tab="${tabId}"]`);
    const targetMobileNav = document.querySelector(`.mobile-nav-btn[data-tab="${tabId}"]`);

    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    if (targetMobileNav) targetMobileNav.classList.add('active');

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'orders') renderOrders();
    if (tabId === 'inventory') renderInventory();
    if (tabId === 'pos') renderPosGrid();
    if (tabId === 'finances') renderFinances();
}

function renderAllViews() {
    checkInventoryAlerts();
    renderDashboard();
    renderOrders();
    renderInventory();
    renderPosGrid();
    renderFinances();
    updateBadges();
}

function checkInventoryAlerts() {
    const criticalItems = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock));
    const notifDot = document.getElementById('notif-dot');
    const notifCountText = document.getElementById('notif-count-text');
    const notifList = document.getElementById('notif-list');
    const banner = document.getElementById('dashboard-stock-banner');

    if (criticalItems.length > 0) {
        if (notifDot) notifDot.classList.add('active');
        if (notifCountText) notifCountText.textContent = `${criticalItems.length} repuestos con stock crítico`;
        
        if (notifList) {
            notifList.innerHTML = criticalItems.map(item => `
                <div class="notif-item">
                    <i class="fa-solid fa-triangle-exclamation text-danger"></i>
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>Stock: <span class="badge badge-danger">${item.stock} uds</span> (Mín: ${item.minStock})</small>
                    </div>
                </div>
            `).join('');
        }

        if (banner) banner.classList.remove('hidden');
    } else {
        if (notifDot) notifDot.classList.remove('active');
        if (notifCountText) notifCountText.textContent = 'Stock en niveles normales';
        if (banner) banner.classList.add('hidden');
    }

    const badgeLow = document.getElementById('badge-low-stock');
    if (badgeLow) badgeLow.textContent = criticalItems.length;
}

function updateBadges() {
    const activeOrders = state.orders.filter(o => o.status !== 'entregado').length;
    const criticalStock = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock)).length;

    const badgeOrders = document.getElementById('badge-total-orders');
    const badgeLowStock = document.getElementById('badge-low-stock');
    const mobileBadgeOrders = document.getElementById('mobile-badge-orders');
    const mobileBadgeStock = document.getElementById('mobile-badge-stock');

    if (badgeOrders) badgeOrders.textContent = activeOrders;
    if (badgeLowStock) badgeLowStock.textContent = criticalStock;
    if (mobileBadgeOrders) mobileBadgeOrders.textContent = activeOrders;
    if (mobileBadgeStock) mobileBadgeStock.textContent = criticalStock;
}

// --------------------------------------------------------------------------
// 1. DASHBOARD VIEW RENDERER
// --------------------------------------------------------------------------
function renderDashboard() {
    const activeOrders = state.orders.filter(o => o.status !== 'entregado');
    const readyOrders = state.orders.filter(o => o.status === 'listo');
    const criticalItems = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock));
    const totalNetProfit = state.finances.reduce((acc, curr) => acc + Number(curr.netProfit || 0), 0);

    document.getElementById('stat-active-orders').textContent = activeOrders.length;
    document.getElementById('stat-ready-orders').textContent = readyOrders.length;
    document.getElementById('stat-critical-stock').textContent = criticalItems.length;
    document.getElementById('stat-monthly-profit').textContent = `$${totalNetProfit.toFixed(2)}`;

    const recentOrders = [...state.orders].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const tbody = document.getElementById('recent-orders-tbody');

    if (tbody) {
        tbody.innerHTML = recentOrders.map(o => `
            <tr>
                <td><strong class="text-purple">${o.id}</strong></td>
                <td>
                    <strong>${o.clientName}</strong><br>
                    <small class="text-muted"><i class="fa-brands fa-whatsapp text-success"></i> ${o.clientPhone}</small>
                </td>
                <td><strong>${o.deviceModel}</strong></td>
                <td><div class="card-fault" style="margin:0">${o.faultDescription}</div></td>
                <td><span class="status-badge status-${o.status}">${getStatusLabel(o.status)}</span></td>
                <td>
                    <strong>$${Number(o.totalCost).toFixed(2)}</strong><br>
                    <small class="text-success">Abono: $${Number(o.advancePayment).toFixed(2)}</small>
                </td>
                <td>
                    <button class="btn-icon-sm" title="Ver / WhatsApp / Imprimir" onclick="openViewOrderModal('${o.id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-icon-sm text-success" title="Enviar WhatsApp" onclick="quickSendWhatsApp('${o.id}')">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function getStatusLabel(status) {
    const map = {
        'ingresado': 'Recibido',
        'diagnostico': 'En Diagnóstico',
        'esperando_repuesto': 'Esperando Repuesto',
        'en_reparacion': 'En Reparación',
        'listo': 'Listo p/ Retiro',
        'entregado': 'Entregado & Pagado'
    };
    return map[status] || status;
}

// --------------------------------------------------------------------------
// 2. ÓRDENES DE SERVICIO
// --------------------------------------------------------------------------
function setOrdersViewMode(mode) {
    state.ordersViewMode = mode;
    document.getElementById('btn-view-kanban')?.classList.toggle('active', mode === 'kanban');
    document.getElementById('btn-view-table')?.classList.toggle('active', mode === 'table');

    document.getElementById('kanban-view-container')?.classList.toggle('hidden', mode !== 'kanban');
    document.getElementById('table-view-container')?.classList.toggle('hidden', mode !== 'table');

    renderOrders();
}

function renderOrders() {
    const searchTerm = (document.getElementById('order-search-input')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('order-status-filter')?.value || 'all';

    let filtered = state.orders.filter(o => {
        const matchesSearch = o.id.toLowerCase().includes(searchTerm) ||
                              o.clientName.toLowerCase().includes(searchTerm) ||
                              o.clientPhone.toLowerCase().includes(searchTerm) ||
                              o.deviceModel.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (state.ordersViewMode === 'kanban') {
        renderKanbanBoard(filtered);
    } else {
        renderOrdersTable(filtered);
    }
}

function renderKanbanBoard(orders) {
    const statuses = ['ingresado', 'diagnostico', 'esperando_repuesto', 'en_reparacion', 'listo', 'entregado'];

    statuses.forEach(status => {
        const colCards = document.getElementById(`cards-${status}`);
        const colCount = document.getElementById(`count-${status}`);
        const items = orders.filter(o => o.status === status);

        if (colCount) colCount.textContent = items.length;

        if (colCards) {
            colCards.innerHTML = items.map(o => `
                <div class="kanban-card" onclick="openViewOrderModal('${o.id}')">
                    <div class="card-top-row">
                        <span class="card-code">${o.id}</span>
                        <small class="text-muted">${formatDateShort(o.date)}</small>
                    </div>
                    <div class="card-client">${o.clientName}</div>
                    <div class="card-device"><i class="fa-solid fa-mobile-screen"></i> ${o.deviceModel}</div>
                    <div class="card-fault">${truncateText(o.faultDescription, 50)}</div>
                    
                    ${o.partName ? `<div style="font-size:0.72rem; color:#2563eb; font-weight:600; margin-bottom:6px;"><i class="fa-solid fa-cube"></i> ${o.partName}</div>` : ''}

                    <div class="card-footer" onclick="event.stopPropagation()">
                        <span class="card-price">$${Number(o.totalCost).toFixed(2)}</span>
                        <div class="card-actions">
                            <select class="form-control btn-sm" onchange="changeOrderStatus('${o.id}', this.value)" style="padding:2px 4px; font-size:0.72rem;">
                                ${statuses.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${getStatusLabel(s)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    });
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('all-orders-table-body');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td><strong class="text-purple">${o.id}</strong></td>
            <td><small>${formatDateShort(o.date)}</small></td>
            <td>
                <strong>${o.clientName}</strong><br>
                <small class="text-muted">${o.clientPhone}</small>
            </td>
            <td><strong>${o.deviceModel}</strong></td>
            <td>${truncateText(o.faultDescription, 45)}</td>
            <td>
                <select class="form-control btn-sm" onchange="changeOrderStatus('${o.id}', this.value)">
                    <option value="ingresado" ${o.status === 'ingresado' ? 'selected' : ''}>Recibido</option>
                    <option value="diagnostico" ${o.status === 'diagnostico' ? 'selected' : ''}>En Diagnóstico</option>
                    <option value="esperando_repuesto" ${o.status === 'esperando_repuesto' ? 'selected' : ''}>Esperando Repuesto</option>
                    <option value="en_reparacion" ${o.status === 'en_reparacion' ? 'selected' : ''}>En Reparación</option>
                    <option value="listo" ${o.status === 'listo' ? 'selected' : ''}>Listo p/ Retiro</option>
                    <option value="entregado" ${o.status === 'entregado' ? 'selected' : ''}>Entregado & Pagado</option>
                </select>
            </td>
            <td>
                <strong>$${Number(o.totalCost).toFixed(2)}</strong><br>
                <small class="text-success">Abono: $${Number(o.advancePayment).toFixed(2)}</small>
            </td>
            <td>
                <button class="btn-icon-sm" title="Ver Detalle" onclick="openViewOrderModal('${o.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon-sm text-success" title="WhatsApp" onclick="quickSendWhatsApp('${o.id}')"><i class="fa-brands fa-whatsapp"></i></button>
            </td>
        </tr>
    `).join('');
}

function changeOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;
    order.status = newStatus;

    if (newStatus === 'entregado' && oldStatus !== 'entregado') {
        const remainingBalance = Number(order.totalCost) - Number(order.advancePayment);
        if (remainingBalance > 0) {
            state.finances.push({
                id: 'fin-' + Date.now(),
                date: new Date().toISOString(),
                type: 'ingreso_servicio',
                ref: `Cobro Final #${order.id} (${order.clientName})`,
                method: 'Efectivo',
                income: remainingBalance,
                cost: order.partCost || 0,
                netProfit: remainingBalance - (order.partCost || 0)
            });
        }
        showToast(`Orden ${order.id} marcada como ENTREGADA y cobrada.`, 'success');
    } else {
        showToast(`Orden ${order.id} cambió a "${getStatusLabel(newStatus)}"`, 'info');
    }

    saveDatabase();
    renderAllViews();
}

// --------------------------------------------------------------------------
// 3. INVENTARIO
// --------------------------------------------------------------------------
function filterInventoryCategory(cat, btnElement) {
    state.inventoryCategoryFilter = cat;
    if (btnElement) {
        btnElement.parentElement.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
    renderInventory();
}

function renderInventory() {
    const searchTerm = (document.getElementById('inventory-search-input')?.value || '').toLowerCase().trim();
    const alertGrid = document.getElementById('alert-items-grid');
    const criticalItems = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock));

    document.getElementById('critical-items-badge-count').textContent = `${criticalItems.length} Ítems Críticos`;

    if (alertGrid) {
        if (criticalItems.length === 0) {
            alertGrid.innerHTML = '<div class="text-success p-2"><i class="fa-solid fa-circle-check"></i> Stock de repuestos y accesorios en niveles óptimos.</div>';
        } else {
            alertGrid.innerHTML = criticalItems.map(item => `
                <div class="critical-item-card">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>Stock: <span class="text-danger font-weight-bold">${item.stock} uds</span> (Mín: ${item.minStock})</small>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="quickRestockItem('${item.id}')">+ Reabastecer</button>
                </div>
            `).join('');
        }
    }

    let items = state.inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || (item.sku && item.sku.toLowerCase().includes(searchTerm));
        if (state.inventoryCategoryFilter === 'low_stock') {
            return matchesSearch && Number(item.stock) <= Number(item.minStock);
        }
        if (state.inventoryCategoryFilter !== 'all') {
            return matchesSearch && item.category === state.inventoryCategoryFilter;
        }
        return matchesSearch;
    });

    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const isCritical = Number(item.stock) <= Number(item.minStock);
        return `
            <tr>
                <td><small class="text-muted">${item.sku || 'N/A'}</small></td>
                <td><strong>${item.name}</strong></td>
                <td><span class="badge badge-light">${item.category}</span></td>
                <td>$${Number(item.priceCost).toFixed(2)}</td>
                <td><strong class="text-success">$${Number(item.priceSale).toFixed(2)}</strong></td>
                <td>
                    <strong class="${isCritical ? 'text-danger font-weight-bold' : ''}">${item.stock} uds</strong>
                </td>
                <td>${item.minStock} uds</td>
                <td>
                    ${isCritical ? '<span class="badge badge-danger">REPOSICIÓN URGENTE</span>' : '<span class="badge badge-success">OK</span>'}
                </td>
                <td>
                    <button class="btn-icon-sm" onclick="adjustItemStock('${item.id}', 1)" title="Sumar 1 unidad"><i class="fa-solid fa-plus"></i></button>
                    <button class="btn-icon-sm" onclick="editInventoryItem('${item.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon-sm text-danger" onclick="deleteInventoryItem('${item.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function saveInventoryItem(e) {
    if (e) e.preventDefault();

    const nameInput = document.getElementById('inv-name');
    if (!nameInput || !nameInput.value.trim()) {
        showToast('Por favor escribe el nombre del producto.', 'warning');
        return;
    }

    const id = document.getElementById('inv-id').value || 'inv-' + Date.now();
    const name = nameInput.value.trim();
    const category = document.getElementById('inv-category').value;
    const sku = document.getElementById('inv-sku').value.trim() || ('SKU-' + Math.floor(Math.random() * 10000));
    const priceCost = parseFloat(document.getElementById('inv-price-cost').value) || 0;
    const priceSale = parseFloat(document.getElementById('inv-price-sale').value) || 0;
    const stock = parseInt(document.getElementById('inv-stock').value) || 0;
    const minStock = parseInt(document.getElementById('inv-min-stock').value) || 2;

    const itemData = { id, name, category, sku, priceCost, priceSale, stock, minStock };
    const existingIndex = state.inventory.findIndex(i => i.id === id);

    if (existingIndex >= 0) {
        state.inventory[existingIndex] = itemData;
        showToast(`Producto "${name}" actualizado.`, 'success');
    } else {
        state.inventory.unshift(itemData);
        showToast(`Nuevo producto "${name}" agregado al inventario.`, 'success');
    }

    saveDatabase();
    closeModal('modal-inventory');
    renderAllViews();
}

function adjustItemStock(itemId, delta) {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;
    item.stock = Math.max(0, Number(item.stock) + delta);
    saveDatabase();
    renderAllViews();
    showToast(`Stock de "${item.name}" actualizado a ${item.stock} uds.`, 'info');
}

function quickRestockItem(itemId) {
    const qty = prompt("¿Cuántas unidades deseas agregar al stock?", "5");
    if (qty && !isNaN(qty)) {
        adjustItemStock(itemId, parseInt(qty));
    }
}

function exportPurchaseList() {
    const criticalItems = state.inventory.filter(item => Number(item.stock) <= Number(item.minStock));
    if (criticalItems.length === 0) {
        alert("No hay repuestos en nivel crítico en este momento.");
        return;
    }

    let text = `====================================================\n`;
    text += `   LISTA DE COMPRA PROVEEDOR - SERVTEC OS\n`;
    text += `   Fecha: ${new Date().toLocaleDateString()}\n`;
    text += `====================================================\n\n`;

    criticalItems.forEach((item, index) => {
        text += `${index + 1}. [${item.sku || 'REP'}] ${item.name}\n`;
        text += `   Stock Actual: ${item.stock} uds | Sugerido a comprar: 5 - 10 uds\n`;
        text += `   Precio Costo Ref: $${item.priceCost}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Pedido_Proveedor_ServTec_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
}

// --------------------------------------------------------------------------
// 4. POS - VENTA RÁPIDA
// --------------------------------------------------------------------------
function filterPosProducts(cat, btnElement) {
    state.posCategoryFilter = cat;
    if (btnElement) {
        btnElement.parentElement.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
    renderPosGrid();
}

function renderPosGrid() {
    const searchTerm = (document.getElementById('pos-search-input')?.value || '').toLowerCase().trim();
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    const products = state.inventory.filter(item => {
        const isPosCat = item.category !== 'repuestos';
        const matchesCat = state.posCategoryFilter === 'all' || item.category === state.posCategoryFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return isPosCat && matchesCat && matchesSearch;
    });

    grid.innerHTML = products.map(p => `
        <div class="pos-product-card" onclick="addToCart('${p.id}')">
            <div class="product-icon"><i class="fa-solid fa-shield"></i></div>
            <div class="product-name">${p.name}</div>
            <div class="text-muted" style="font-size:0.72rem;">Stock: ${p.stock} uds</div>
            <div class="product-price">$${Number(p.priceSale).toFixed(2)}</div>
        </div>
    `).join('');

    renderCart();
}

function addToCart(productId) {
    const product = state.inventory.find(i => i.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast(`Sin stock de "${product.name}"`, 'danger');
        return;
    }

    const existing = state.cart.find(c => c.id === productId);
    if (existing) {
        if (existing.qty + 1 > product.stock) {
            showToast(`Stock máximo alcanzado (${product.stock} uds)`, 'warning');
            return;
        }
        existing.qty++;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            priceSale: product.priceSale,
            priceCost: product.priceCost,
            qty: 1
        });
    }

    renderCart();
}

function updateCartQty(productId, delta) {
    const item = state.cart.find(c => c.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        state.cart = state.cart.filter(c => c.id !== productId);
    }
    renderCart();
}

function clearPosCart() {
    state.cart = [];
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-list');
    if (!container) return;
    let subtotal = 0;

    container.innerHTML = state.cart.map(item => {
        const itemTotal = item.priceSale * item.qty;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <div style="flex:1;"><strong>${item.name}</strong></div>
                <div style="display:flex; align-items:center; gap:4px; margin:0 8px;">
                    <button class="btn-icon-sm" onclick="updateCartQty('${item.id}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="btn-icon-sm" onclick="updateCartQty('${item.id}', 1)">+</button>
                </div>
                <strong>$${itemTotal.toFixed(2)}</strong>
            </div>
        `;
    }).join('');

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${subtotal.toFixed(2)}`;
}

function processPosCheckout() {
    if (state.cart.length === 0) {
        showToast('El carrito está vacío.', 'warning');
        return;
    }

    const method = document.getElementById('pos-payment-method').value;
    let totalSale = 0;
    let totalCost = 0;

    state.cart.forEach(cartItem => {
        const invItem = state.inventory.find(i => i.id === cartItem.id);
        if (invItem) {
            invItem.stock = Math.max(0, invItem.stock - cartItem.qty);
        }
        totalSale += cartItem.priceSale * cartItem.qty;
        totalCost += cartItem.priceCost * cartItem.qty;
    });

    const netProfit = totalSale - totalCost;

    state.finances.push({
        id: 'fin-' + Date.now(),
        date: new Date().toISOString(),
        type: 'ingreso_pos',
        ref: `Venta POS (${state.cart.map(c => `${c.qty}x ${c.name}`).join(', ')})`,
        method: method,
        income: totalSale,
        cost: totalCost,
        netProfit: netProfit
    });

    saveDatabase();
    clearPosCart();
    renderAllViews();

    showToast(`Venta POS registrada. Ganancia: +$${netProfit.toFixed(2)}`, 'success');
}

// --------------------------------------------------------------------------
// 5. FINANZAS & CAJA
// --------------------------------------------------------------------------
function renderFinances() {
    let totalRev = 0;
    let totalCosts = 0;
    let totalExpenses = 0;

    state.finances.forEach(f => {
        totalRev += Number(f.income || 0);
        totalCosts += Number(f.cost || 0);
        if (f.type === 'gasto') {
            totalExpenses += Math.abs(Number(f.netProfit || 0));
        }
    });

    const netProfitClean = totalRev - totalCosts - totalExpenses;

    document.getElementById('fin-total-revenue').textContent = `$${totalRev.toFixed(2)}`;
    document.getElementById('fin-total-costs').textContent = `$${totalCosts.toFixed(2)}`;
    document.getElementById('fin-total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('fin-net-profit').textContent = `$${netProfitClean.toFixed(2)}`;

    const tbody = document.getElementById('finances-table-body');
    if (!tbody) return;

    const sorted = [...state.finances].sort((a,b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(f => `
        <tr>
            <td><small>${formatDateFull(f.date)}</small></td>
            <td><span class="badge ${f.type === 'gasto' ? 'badge-danger' : 'badge-success'}">${f.type.toUpperCase()}</span></td>
            <td><strong>${f.ref}</strong></td>
            <td><small class="text-muted">${f.method}</small></td>
            <td class="text-success">+$${Number(f.income || 0).toFixed(2)}</td>
            <td class="text-muted">-$${Number(f.cost || 0).toFixed(2)}</td>
            <td><strong class="${Number(f.netProfit) >= 0 ? 'text-purple' : 'text-danger'}">$${Number(f.netProfit || 0).toFixed(2)}</strong></td>
        </tr>
    `).join('');
}

// --------------------------------------------------------------------------
// 6. MODALS & FORMS
// --------------------------------------------------------------------------
function openNewOrderModal() {
    document.getElementById('form-order').reset();
    document.getElementById('order-id').value = '';
    
    document.getElementById('order-part-source-type').value = 'existing';
    togglePartSourceType('existing');

    const partSelect = document.getElementById('order-part-select');
    const repuestos = state.inventory.filter(i => i.category === 'repuestos');
    partSelect.innerHTML = '<option value="">-- Sin repuesto del inventario --</option>' +
        repuestos.map(r => `<option value="${r.id}">${r.name} (Costo: $${r.priceCost} | Stock: ${r.stock})</option>`).join('');

    openModal('modal-order');
}

function togglePartSourceType(type) {
    const groupExisting = document.getElementById('group-part-existing');
    const groupCustom = document.getElementById('group-part-custom');
    const groupCustomCost = document.getElementById('group-part-custom-cost');

    if (type === 'existing') {
        groupExisting?.classList.remove('hidden');
        groupCustom?.classList.add('hidden');
        groupCustomCost?.classList.add('hidden');
    } else {
        groupExisting?.classList.add('hidden');
        groupCustom?.classList.remove('hidden');
        groupCustomCost?.classList.remove('hidden');
    }
}

function autoCalculateOrderCosts() {
    const partId = document.getElementById('order-part-select').value;
    const part = state.inventory.find(i => i.id === partId);
    if (part) {
        document.getElementById('order-cost-total').value = part.priceSale.toFixed(2);
    }
}

function saveOrder(e) {
    if (e) e.preventDefault();

    const orderId = document.getElementById('order-id').value || 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const clientName = document.getElementById('order-client-name').value;
    const clientPhone = document.getElementById('order-client-phone').value;
    const deviceModel = document.getElementById('order-device-model').value;
    const imei = document.getElementById('order-device-imei').value;
    const passCode = document.getElementById('order-device-pass').value;
    const faultDescription = document.getElementById('order-fault-description').value;

    const partSourceType = document.getElementById('order-part-source-type').value;
    let partId = '';
    let partName = '';
    let partCost = 0;

    if (partSourceType === 'existing') {
        partId = document.getElementById('order-part-select').value;
        const selectedPart = state.inventory.find(i => i.id === partId);
        if (selectedPart) {
            partName = selectedPart.name;
            partCost = selectedPart.priceCost;
            selectedPart.stock = Math.max(0, selectedPart.stock - 1);
        }
    } else {
        partName = document.getElementById('order-part-custom-name').value || 'Repuesto Especial Externo';
        partCost = parseFloat(document.getElementById('order-part-custom-cost-val').value) || 0;
    }

    const totalCost = parseFloat(document.getElementById('order-cost-total').value) || 0;
    const advancePayment = parseFloat(document.getElementById('order-cost-advance').value) || 0;

    const checklist = {
        prende: document.getElementById('chk-prende').checked,
        tactil: document.getElementById('chk-tactil').checked,
        camaras: document.getElementById('chk-camaras').checked,
        audio: document.getElementById('chk-audio').checked,
        carga: document.getElementById('chk-carga').checked,
        sim: document.getElementById('chk-sim').checked
    };

    const newOrder = {
        id: orderId,
        clientName,
        clientPhone,
        deviceModel,
        imei,
        passCode,
        checklist,
        faultDescription,
        partSourceType,
        partId,
        partName,
        partCost,
        totalCost,
        advancePayment,
        status: 'ingresado',
        date: new Date().toISOString()
    };

    if (advancePayment > 0) {
        state.finances.push({
            id: 'fin-' + Date.now(),
            date: new Date().toISOString(),
            type: 'ingreso_servicio',
            ref: `Abono #${orderId} (${clientName})`,
            method: 'Efectivo',
            income: advancePayment,
            cost: partCost,
            netProfit: advancePayment - partCost
        });
    }

    state.orders.unshift(newOrder);
    saveDatabase();
    closeModal('modal-order');
    renderAllViews();

    showToast(`Orden ${orderId} registrada con éxito.`, 'success');
}

function openViewOrderModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    window.currentActiveOrder = order;
    document.getElementById('view-order-code-badge').textContent = order.id;

    const receiptContainer = document.getElementById('printable-order-receipt');
    if (receiptContainer) {
        receiptContainer.innerHTML = `
            <div class="receipt-box">
                <div class="receipt-header">
                    <div class="receipt-title">SERVTEC - SERVICIO TÉCNICO</div>
                    <small>Comprobante de Servicio #${order.id}</small>
                </div>
                <div class="receipt-row"><span>Cliente:</span><strong>${order.clientName}</strong></div>
                <div class="receipt-row"><span>WhatsApp:</span><strong>${order.clientPhone}</strong></div>
                <div class="receipt-row"><span>Fecha:</span><span>${formatDateFull(order.date)}</span></div>
                <hr style="border-top:1px dashed #cbd5e1; margin:8px 0;">
                <div class="receipt-row"><span>Equipo / Modelo:</span><strong>${order.deviceModel}</strong></div>
                <div class="receipt-row"><span>IMEI:</span><span>${order.imei || 'N/A'}</span></div>
                <div style="background:#f8fafc; padding:6px; border-radius:4px; margin:8px 0; font-size:0.78rem; border:1px solid #e2e8f0;">
                    <strong>Falla:</strong> ${order.faultDescription}
                </div>
                ${order.partName ? `<div class="receipt-row"><span>Repuesto:</span><span>${order.partName}</span></div>` : ''}
                <hr style="border-top:2px dashed #cbd5e1; margin:8px 0;">
                <div class="receipt-row"><span>TOTAL:</span><strong style="font-size:1rem;">$${Number(order.totalCost).toFixed(2)}</strong></div>
                <div class="receipt-row text-success"><span>ABONO:</span><strong>$${Number(order.advancePayment).toFixed(2)}</strong></div>
                <div class="receipt-row text-danger"><span>SALDO PENDIENTE:</span><strong>$${(Number(order.totalCost) - Number(order.advancePayment)).toFixed(2)}</strong></div>
            </div>
        `;
    }

    openModal('modal-view-order');
}

function quickSendWhatsApp(orderId) {
    const o = state.orders.find(item => item.id === orderId);
    if (!o) return;

    const phoneClean = o.clientPhone.replace(/[^0-9]/g, '');
    const text = `Hola *${o.clientName}*, te saludamos de *ServTec* 🛠️.\n` +
                 `Estado de tu equipo *${o.deviceModel}* (#${o.id}): *${getStatusLabel(o.status)}*.\n` +
                 `Presupuesto Total: $${Number(o.totalCost).toFixed(2)}`;

    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, '_blank');
}

function sendOrderWhatsApp() {
    if (window.currentActiveOrder) {
        quickSendWhatsApp(window.currentActiveOrder.id);
    }
}

function printReceipt() { window.print(); }

function openNewInventoryModal() {
    document.getElementById('form-inventory').reset();
    document.getElementById('inv-id').value = '';
    document.getElementById('inv-price-cost').value = '10.00';
    document.getElementById('inv-price-sale').value = '25.00';
    document.getElementById('inv-stock').value = '5';
    document.getElementById('inv-min-stock').value = '2';
    openModal('modal-inventory');
}

function openExpenseModal() {
    document.getElementById('form-expense').reset();
    openModal('modal-expense');
}

function saveExpense(e) {
    if (e) e.preventDefault();
    const concept = document.getElementById('expense-concept').value;
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const method = document.getElementById('expense-method').value;

    state.finances.push({
        id: 'fin-' + Date.now(),
        date: new Date().toISOString(),
        type: 'gasto',
        ref: concept,
        method: method,
        income: 0,
        cost: amount,
        netProfit: -amount
    });

    saveDatabase();
    closeModal('modal-expense');
    renderAllViews();
    showToast(`Gasto de $${amount.toFixed(2)} registrado.`, 'warning');
}

// Helpers
function openModal(modalId) { document.getElementById(modalId)?.classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('active'); }
function toggleNotificationsMenu() { document.getElementById('notifications-menu')?.classList.toggle('active'); }

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-info-circle"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function formatDateShort(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getDate()}/${d.getMonth()+1}`;
}

function formatDateFull(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function truncateText(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}
