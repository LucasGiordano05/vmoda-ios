const CapacitorBridge = window.Capacitor;
const Plugins = CapacitorBridge?.Plugins ?? {};
const Camera = Plugins.Camera;
const Haptics = Plugins.Haptics;
const Share = Plugins.Share;
const FirebaseMessaging = Plugins.FirebaseMessaging;

const isNative = Boolean(
  CapacitorBridge &&
  typeof CapacitorBridge.isNativePlatform === 'function' &&
  CapacitorBridge.isNativePlatform()
);

window.VModa = window.VModa || {};

function dataUrlToFile(dataUrl, filename) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime, lastModified: Date.now() });
}

function applyFileToInput(input, file) {
  if (!input) return;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function abrirCamara(targetInput, options = {}) {
  if (!isNative || !Camera) {
    targetInput?.click?.();
    return null;
  }

  const photo = await Camera.getPhoto({
    quality: options.quality ?? 92,
    allowEditing: false,
    resultType: 'dataUrl',
    source: options.source ?? 'PROMPT',
    direction: options.direction ?? 'FRONT',
    promptLabelHeader: 'Foto para VModa',
    promptLabelPhoto: 'Elegir de Fotos',
    promptLabelPicture: 'Abrir camara',
    promptLabelCancel: 'Cancelar',
  });

  if (!photo?.dataUrl) return null;

  const file = dataUrlToFile(photo.dataUrl, `vmoda-tryon-${Date.now()}.jpg`);
  applyFileToInput(targetInput, file);
  window.VModa.haptic?.success?.();
  return file;
}

function isImageInput(input) {
  if (!input || input.type !== 'file') return false;

  const accept = (input.getAttribute('accept') || '').toLowerCase();
  return (
    accept.includes('image') ||
    accept.includes('.jpg') ||
    accept.includes('.jpeg') ||
    accept.includes('.png') ||
    accept.includes('.webp') ||
    accept.includes('.avif')
  );
}

function wireExistingLabels(input) {
  const id = input.id;
  if (!id) return false;

  const labels = document.querySelectorAll(`label[for="${CSS.escape(id)}"]`);
  labels.forEach((label) => {
    if (label.dataset.vmodaNativeCameraLabel === '1') return;

    label.dataset.vmodaNativeCameraLabel = '1';
    label.setAttribute('role', label.getAttribute('role') || 'button');
    label.addEventListener('click', (event) => {
      if (!isNative) return;
      event.preventDefault();
      abrirCamara(input);
    });
  });

  return labels.length > 0;
}

function decorateImageInput(input) {
  if (!isNative || !isImageInput(input)) return;
  if (input.dataset.vmodaNativeCamera === '1') return;

  input.dataset.vmodaNativeCamera = '1';

  const hasLabel = wireExistingLabels(input);
  const computed = window.getComputedStyle(input);
  const isVisuallyHidden = input.hidden || computed.display === 'none' || computed.visibility === 'hidden';

  if (hasLabel && isVisuallyHidden) return;

  input.classList.add('vmoda-native-file-original');
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;

  const wrap = document.createElement('div');
  wrap.className = 'vmoda-native-file-actions';
  wrap.dataset.vmodaNativeGenerated = '1';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-dark vmoda-native-camera-btn';
  button.textContent = input.multiple ? 'Elegir imagen nativa' : 'Subir foto nativa';
  button.addEventListener('click', () => abrirCamara(input));

  wrap.appendChild(button);
  input.insertAdjacentElement('afterend', wrap);
}

function interceptImageInputs() {
  document.querySelectorAll('input[type="file"]').forEach(decorateImageInput);
}

function normalizeHapticType(type) {
  return (type || '').toLowerCase().trim();
}

const hapticApi = {
  light: () => Haptics?.impact?.({ style: 'LIGHT' }).catch(() => {}),
  medium: () => Haptics?.impact?.({ style: 'MEDIUM' }).catch(() => {}),
  heavy: () => Haptics?.impact?.({ style: 'HEAVY' }).catch(() => {}),
  success: () => Haptics?.notification?.({ type: 'SUCCESS' }).catch(() => {}),
  error: () => Haptics?.notification?.({ type: 'ERROR' }).catch(() => {}),
};

function triggerHaptic(type) {
  const normalized = normalizeHapticType(type);
  if (hapticApi[normalized]) hapticApi[normalized]();
}

function installHaptics() {
  if (!isNative || window.__vmodaHapticsReady) return;
  window.__vmodaHapticsReady = true;

  document.addEventListener('click', (event) => {
    const explicit = event.target.closest?.('[data-haptic]');
    if (explicit) {
      triggerHaptic(explicit.dataset.haptic || 'light');
      return;
    }

    if (event.target.closest?.('.btn-agregar-carrito, #addToCartForm button[type="submit"]')) {
      hapticApi.medium();
      return;
    }

    if (event.target.closest?.('.btn-favorito, form[action*="Favoritos"] button')) {
      hapticApi.medium();
      return;
    }

    if (event.target.closest?.('.btn-tryon, .btn-probador, [href*="ClosetVirtual"]')) {
      hapticApi.heavy();
    }
  }, { passive: true });
}

async function compartir(titulo, texto, url) {
  const shareUrl = url || window.location.href;

  if (isNative && Share?.share) {
    await Share.share({
      title: titulo || document.title || 'VModa',
      text: texto || 'Mira esto en VModa',
      url: shareUrl,
      dialogTitle: 'Compartir VModa',
    });
    return;
  }

  if (navigator.share) {
    await navigator.share({ title: titulo, text: texto, url: shareUrl });
  }
}

function injectProductShareButton() {
  if (!isNative || document.querySelector('[data-vmoda-native-share]')) return;

  const isProductDetail =
    window.location.pathname.toLowerCase().includes('/productos/detalle') ||
    document.querySelector('.producto-detalle');

  const productInput = document.querySelector('input[name="productoId"]');
  if (!isProductDetail || !productInput) return;

  const anchor = document.querySelector('#addToCartForm') || productInput.closest('form');
  if (!anchor) return;

  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline-dark mt-2 vmoda-native-share-btn';
  button.dataset.vmodaNativeShare = '1';
  button.dataset.haptic = 'light';
  button.innerHTML = '<span aria-hidden="true">Compartir</span>';
  button.addEventListener('click', () => compartir(title, 'Mira esta prenda en VModa', window.location.href));

  anchor.insertAdjacentElement('afterend', button);
}

function getNotificationUrl(notification) {
  return (
    notification?.data?.url ||
    notification?.notification?.data?.url ||
    notification?.url ||
    '/'
  );
}

function showInAppNotification(notification) {
  const title =
    notification?.notification?.title ||
    notification?.title ||
    notification?.data?.title ||
    'VModa';
  const body =
    notification?.notification?.body ||
    notification?.body ||
    notification?.data?.body ||
    'Nueva notificacion';
  const url = getNotificationUrl(notification);

  const existing = document.querySelector('.vmoda-native-notification');
  existing?.remove();

  const banner = document.createElement('button');
  banner.type = 'button';
  banner.className = 'vmoda-native-notification';
  banner.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  banner.addEventListener('click', () => {
    banner.remove();
    if (url) window.location.href = url;
  });

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));
  window.setTimeout(() => {
    banner.classList.remove('is-visible');
    window.setTimeout(() => banner.remove(), 240);
  }, 5200);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function postNativeToken(token) {
  const response = await fetch('/api/notificaciones/registrar-token-nativo', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: 'ios' }),
  });

  if (!response.ok) throw new Error(`No se pudo registrar FCM token (${response.status})`);
  return response.json().catch(() => ({ ok: true }));
}

async function initPushNotifications() {
  if (!isNative || !FirebaseMessaging || window.__vmodaNativePushReady) return;
  window.__vmodaNativePushReady = true;

  try {
    const supported = await FirebaseMessaging.isSupported?.();
    if (supported && supported.isSupported === false) return;

    let permission = await FirebaseMessaging.checkPermissions?.();
    if (permission?.receive !== 'granted') {
      permission = await FirebaseMessaging.requestPermissions?.();
    }
    if (permission?.receive !== 'granted') return;

    const tokenResult = await FirebaseMessaging.getToken();
    if (tokenResult?.token) await postNativeToken(tokenResult.token);

    await FirebaseMessaging.addListener?.('tokenReceived', (event) => {
      if (event?.token) postNativeToken(event.token).catch(console.warn);
    });

    await FirebaseMessaging.addListener?.('notificationReceived', (notification) => {
      showInAppNotification(notification);
      hapticApi.success();
    });

    await FirebaseMessaging.addListener?.('notificationActionPerformed', (event) => {
      const url = getNotificationUrl(event?.notification || event);
      if (url) window.location.href = url;
    });
  } catch (error) {
    console.warn('[VModa native] push init skipped:', error);
  }
}

function initNativeBridge() {
  if (!isNative) return;

  document.documentElement.classList.add('is-native-app');
  window.VModa.abrirCamara = abrirCamara;
  window.VModa.compartir = compartir;
  window.VModa.haptic = hapticApi;
  window.VModa.reaplicarNativo = () => {
    interceptImageInputs();
    injectProductShareButton();
  };

  interceptImageInputs();
  installHaptics();
  injectProductShareButton();
  initPushNotifications();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => window.VModa.reaplicarNativo?.());
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.dispatchEvent(new CustomEvent('vmoda:native-ready'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNativeBridge, { once: true });
} else {
  initNativeBridge();
}
