"use client";

import { useEffect, useRef } from "react";

import { readTurnstileSiteKey } from "@/lib/auth/turnstile-config";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __archlucidTurnstileOnLoad?: () => void;
  }
}

const TURNSTILE_SCRIPT_ID = "archlucid-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileBotChallengeProps = {
  readonly onTokenChange: (token: string | null) => void;
};

/**
 * Renders Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Hidden when the public site key is absent (mirrors supplemental OIDC advertising).
 */
export function TurnstileBotChallenge({ onTokenChange }: TurnstileBotChallengeProps) {
  const siteKey = readTurnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || containerRef.current === null) {
      return;
    }

    let disposed = false;

    const renderWidget = () => {
      if (disposed || containerRef.current === null || window.turnstile === undefined) {
        return;
      }

      if (widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => {
          onTokenChange(token);
        },
        "expired-callback": () => {
          onTokenChange(null);
        },
        "error-callback": () => {
          onTokenChange(null);
        },
        theme: "auto",
      });
    };

    const ensureScript = () => {
      if (window.turnstile !== undefined) {
        renderWidget();

        return;
      }

      const existing = document.getElementById(TURNSTILE_SCRIPT_ID);

      if (existing !== null) {
        window.__archlucidTurnstileOnLoad = renderWidget;

        return;
      }

      window.__archlucidTurnstileOnLoad = renderWidget;

      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.__archlucidTurnstileOnLoad?.();
      };
      document.head.appendChild(script);
    };

    ensureScript();

    return () => {
      disposed = true;

      if (widgetIdRef.current !== null && window.turnstile !== undefined) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      onTokenChange(null);
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className="mt-2" data-testid="turnstile-bot-challenge" />;
}
