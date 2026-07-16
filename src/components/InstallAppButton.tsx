"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    setAvailable(true);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setAvailable(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setPromptEvent(null);
      return;
    }

    if (isIos()) {
      window.alert("To install SignSeal IQ on iPhone or iPad, open this page in Safari, tap Share, then choose Add to Home Screen.");
      return;
    }

    window.alert("Use your browser menu and choose Install app or Add to Home screen. On Android Chrome this button will show the install prompt once the app is eligible.");
  }

  if (!available) return null;

  return (
    <button className="button-secondary min-h-9 px-3" type="button" onClick={install}>
      <Download size={16} /> Install app
    </button>
  );
}
