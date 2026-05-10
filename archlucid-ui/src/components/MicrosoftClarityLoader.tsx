"use client";

import { useEffect } from "react";

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

/**
 * Loads Microsoft Clarity after explicit consent. CSP must allow https://www.clarity.ms (next.config.ts).
 */
export function MicrosoftClarityLoader(props: { projectId: string }) {
  useEffect(() => {
    if (props.projectId.length === 0)
      return;

    const tryLoad = (): void => {
      if (typeof window === "undefined")
        return;

      if (window.localStorage.getItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY) !== "granted")
        return;

      const w = window as Window & { clarity?: (action: string, id: string) => void };

      if (w.clarity)
        return;

      const script = document.createElement("script");

      script.async = true;
      script.src = `https://www.clarity.ms/tag/${encodeURIComponent(props.projectId)}`;

      const firstScript = document.getElementsByTagName("script")[0];

      firstScript?.parentNode?.insertBefore(script, firstScript);
    };

    tryLoad();

    const onConsentChanged = (): void => tryLoad();

    window.addEventListener("archlucid-marketing-consent-changed", onConsentChanged);

    return () => window.removeEventListener("archlucid-marketing-consent-changed", onConsentChanged);
  }, [props.projectId]);

  return null;
}
