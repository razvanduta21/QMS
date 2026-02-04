export function trackEvent(name, payload = {}) {
  if (import.meta.env.DEV) {
    console.log('[QMS event]', name, payload);
  }
}
