const CapacitorBridge = window.Capacitor;
const isNative = Boolean(
  CapacitorBridge &&
  typeof CapacitorBridge.isNativePlatform === 'function' &&
  CapacitorBridge.isNativePlatform()
);

const tabs = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/',
    match: (path) => path === '/',
    icon: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/></svg>',
  },
  {
    id: 'explorar',
    label: 'Explorar',
    href: '/Productos/Explorar',
    match: (path) => path.startsWith('/productos'),
    icon: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"/></svg>',
  },
  {
    id: 'probador',
    label: 'Probador',
    href: '/ClosetVirtual',
    featured: true,
    match: (path) => path.startsWith('/closetvirtual') || path.startsWith('/tryon'),
    icon: '<svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 1 3 3c0 1.12-.62 2.1-1.54 2.62L19 11.2V21H5v-9.8l5.54-2.58A3 3 0 0 1 12 3Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-5 7.48V19h10v-6.52l-5-2.33-5 2.33Z"/></svg>',
  },
  {
    id: 'carrito',
    label: 'Carrito',
    href: '/Carrito',
    match: (path) => path.startsWith('/carrito') || path.startsWith('/pago'),
    icon: '<svg viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .01 0H17ZM4.2 4l1.7 9.6A3 3 0 0 0 8.86 16h7.9a3 3 0 0 0 2.9-2.25L21 8H7.15l-.5-3H3V4h1.2Z"/></svg>',
  },
  {
    id: 'perfil',
    label: 'Perfil',
    href: '/Clientes/Perfil',
    match: (path) => path.startsWith('/clientes') || path.startsWith('/usuario') || path.startsWith('/compras'),
    icon: '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/></svg>',
  },
];

function getCartCount() {
  const fromDom = document.querySelector('.carrito-count, [data-cart-count]')?.textContent?.trim();
  const fromBody = document.body?.dataset?.cartCount;
  const value = Number.parseInt(fromDom || fromBody || '0', 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function activeTabId() {
  const path = window.location.pathname.toLowerCase();
  return tabs.find((tab) => tab.match(path))?.id || 'home';
}

function renderTabBar() {
  if (!isNative) return;

  let bar = document.querySelector('.vmoda-native-tabbar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.className = 'vmoda-native-tabbar';
    bar.setAttribute('aria-label', 'Navegacion principal');
    document.body.appendChild(bar);
  }

  const active = activeTabId();
  const cartCount = getCartCount();

  bar.innerHTML = tabs.map((tab) => {
    const isActive = tab.id === active;
    const badge = tab.id === 'carrito' && cartCount > 0
      ? `<span class="vmoda-native-tab-badge">${cartCount > 99 ? '99+' : cartCount}</span>`
      : '';

    return `
      <a class="vmoda-native-tab ${isActive ? 'is-active' : ''} ${tab.featured ? 'is-featured' : ''}"
         href="${tab.href}"
         data-haptic="${tab.featured ? 'heavy' : 'light'}"
         aria-current="${isActive ? 'page' : 'false'}">
        <span class="vmoda-native-tab-icon">${tab.icon}${badge}</span>
        <span class="vmoda-native-tab-label">${tab.label}</span>
      </a>
    `;
  }).join('');
}

function initTabBar() {
  if (!isNative) return;

  document.documentElement.classList.add('is-native-app');
  renderTabBar();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(renderTabBar);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  window.addEventListener('popstate', renderTabBar);
  document.addEventListener('vmoda:native-ready', renderTabBar);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabBar, { once: true });
} else {
  initTabBar();
}
