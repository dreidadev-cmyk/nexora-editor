import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): string {
  return Capacitor.getPlatform();
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

// Android Back Button handler registration
export function registerBackButtonHandler(callback: () => boolean) {
  if (typeof window === "undefined") return;

  const handlePopState = (e: PopStateEvent) => {
    const handled = callback();
    if (handled) {
      // Prevent standard browser back by pushing state again
      window.history.pushState({ nexora: true }, "");
    }
  };

  window.addEventListener("popstate", handlePopState);
  window.history.pushState({ nexora: true }, "");

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}

export async function shareProjectLink(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native share failed:", err);
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
