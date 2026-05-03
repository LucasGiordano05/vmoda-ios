const CapacitorBridge = window.Capacitor;
const isNative = Boolean(
  CapacitorBridge &&
  typeof CapacitorBridge.isNativePlatform === 'function' &&
  CapacitorBridge.isNativePlatform()
);

function isInternalNavigableLink(anchor) {
  if (!anchor) return false;
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;

  const href = anchor.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function installPageTransitions() {
  document.body.classList.add('page-enter');
  window.requestAnimationFrame(() => document.body.classList.add('page-enter-active'));

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a');
    if (!isInternalNavigableLink(anchor)) return;

    document.body.classList.add('page-exit');
  }, true);
}

function installPullToRefresh() {
  let startY = 0;
  let pulling = false;
  let distance = 0;

  const indicator = document.createElement('div');
  indicator.className = 'vmoda-native-pull-refresh';
  indicator.innerHTML = '<span></span>';
  document.body.appendChild(indicator);

  document.addEventListener('touchstart', (event) => {
    if (window.scrollY > 0 || event.touches.length !== 1) return;
    startY = event.touches[0].clientY;
    pulling = true;
    distance = 0;
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!pulling) return;
    distance = Math.max(0, event.touches[0].clientY - startY);
    if (distance < 10) return;

    const progress = Math.min(distance / 96, 1);
    indicator.style.transform = `translate(-50%, ${Math.round(progress * 58)}px)`;
    indicator.style.opacity = String(progress);
    indicator.classList.toggle('is-ready', distance > 86);
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;

    if (distance > 86) {
      indicator.classList.add('is-refreshing');
      window.VModa?.haptic?.medium?.();
      window.setTimeout(() => window.location.reload(), 220);
      return;
    }

    indicator.classList.remove('is-ready');
    indicator.style.transform = 'translate(-50%, -52px)';
    indicator.style.opacity = '0';
  }, { passive: true });
}

function installStatusBarDoubleTap() {
  let lastTap = 0;

  document.addEventListener('touchend', (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch || touch.clientY > 44) return;

    const now = Date.now();
    if (now - lastTap < 320) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.VModa?.haptic?.light?.();
    }
    lastTap = now;
  }, { passive: true });
}

function rerunNativeInterceptors() {
  window.VModa?.reaplicarNativo?.();
}

function initNativeAnimations() {
  if (!isNative) return;

  document.documentElement.classList.add('is-native-app');
  installPageTransitions();
  installPullToRefresh();
  installStatusBarDoubleTap();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(rerunNativeInterceptors);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNativeAnimations, { once: true });
} else {
  initNativeAnimations();
}
