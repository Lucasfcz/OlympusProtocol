import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type InstallPlatform = "android" | "ios" | "desktop";
type InstallOutcome = "accepted" | "dismissed" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  installPromptAvailable: boolean;
  isInstalled: boolean;
  platform: InstallPlatform;
  promptInstall: () => Promise<InstallOutcome>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined);

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installListenersBound = false;
const promptListeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

function emitPromptChange() {
  promptListeners.forEach((listener) => listener(deferredInstallPrompt));
}

function subscribeToPrompt(listener: (event: BeforeInstallPromptEvent | null) => void) {
  promptListeners.add(listener);
  listener(deferredInstallPrompt);
  return () => promptListeners.delete(listener);
}

function bindInstallPromptEvents() {
  if (typeof window === "undefined" || installListenersBound) return;
  installListenersBound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    emitPromptChange();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    emitPromptChange();
  });
}

bindInstallPromptEvents();

function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIos =
    /iPad|iPhone|iPod/i.test(platform) ||
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(deferredInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");

  useEffect(() => {
    bindInstallPromptEvents();
    setPlatform(detectPlatform());
    setIsInstalled(isRunningStandalone());

    const unsubscribe = subscribeToPrompt(setInstallPrompt);
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstallState = () => setIsInstalled(isRunningStandalone());

    displayMode.addEventListener("change", updateInstallState);
    window.addEventListener("appinstalled", updateInstallState);

    return () => {
      unsubscribe();
      displayMode.removeEventListener("change", updateInstallState);
      window.removeEventListener("appinstalled", updateInstallState);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!installPrompt) return "unavailable";

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      deferredInstallPrompt = null;
      emitPromptChange();
      return choice.outcome;
    } catch {
      deferredInstallPrompt = null;
      emitPromptChange();
      return "unavailable";
    }
  }, [installPrompt]);

  const value = useMemo<PwaInstallContextValue>(() => ({
    installPromptAvailable: Boolean(installPrompt),
    isInstalled,
    platform,
    promptInstall,
  }), [installPrompt, isInstalled, platform, promptInstall]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return context;
}