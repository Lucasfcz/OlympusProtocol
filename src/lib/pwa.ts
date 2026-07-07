// Guarded PWA service worker registration.
// Never registers in dev, localhost, iframe, or preview hosts.
// Any real production host is allowed, including Vercel and future custom domains.
// Unregisters any existing /sw.js in blocked contexts, and supports ?sw=off kill switch.

const APP_SW_URL = "/sw.js";
let registrationStarted = false;

function isPreviewHost(host: string) {
  const normalizedHost = host.toLowerCase();
  return (
    normalizedHost.includes("id-preview--") ||
    normalizedHost.includes("preview--") ||
    normalizedHost === "lovableproject.com" ||
    normalizedHost.endsWith(".lovableproject.com") ||
    normalizedHost === "lovableproject-dev.com" ||
    normalizedHost.endsWith(".lovableproject-dev.com") ||
    normalizedHost === "beta.lovable.dev" ||
    normalizedHost.endsWith(".beta.lovable.dev")
  );
}

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function unregisterAppSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(APP_SW_URL)) await r.unregister();
    }
  } catch {
    // no-op
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isProd = import.meta.env.PROD;
  const inIframe = isInIframe();
  const host = window.location.hostname;
  const killSwitch = new URLSearchParams(window.location.search).has("sw") &&
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (!isProd || isLocalHost(host) || inIframe || isPreviewHost(host) || killSwitch) {
    void unregisterAppSW();
    return;
  }

  if (registrationStarted) return;
  registrationStarted = true;

  const register = () => {
    navigator.serviceWorker.register(APP_SW_URL, { scope: "/" }).catch(() => {
      // ignore
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
