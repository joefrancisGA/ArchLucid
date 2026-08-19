"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { appSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void): () => void {
  const handler = (): void => callback();

  window.addEventListener("storage", handler);
  window.addEventListener("archlucid-frictionless-trial-changed", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("archlucid-frictionless-trial-changed", handler);
  };
}

function getSnapshot(): boolean {
  return readFrictionlessTrialSessionEnabled();
}

function getServerSnapshot(): boolean {
  return false;
}

/** Prompts frictionless trial visitors to create a workspace after exploring the showcase review. */
export function FrictionlessTrialBanner() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!active) {
    return null;
  }

  return (
    <div
      className={cn(
        // Put explicit fg after helper — helper includes text-al-text-secondary.
        OPERATOR_TYPOGRAPHY.helper,
        "border-b border-teal-700/25 bg-teal-50 px-4 py-1 text-teal-950 dark:border-teal-800/60 dark:bg-teal-950 dark:text-teal-50",
      )}
      data-testid="frictionless-trial-banner"
      role="status"
    >
      {/* Single-line sticky budget — no wrap so the header stack stays one slim strip. */}
      <div className="mx-auto flex max-w-[1440px] flex-nowrap items-center justify-between gap-3 overflow-x-auto">
        <p className="m-0 min-w-0 truncate">
          You are inspecting a sample review — fabricated data only, no sign-in required.
        </p>
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <Button type="button" size="sm" variant="primary" asChild className="h-7 px-2.5">
            <Link href="/signup">Start an evaluation</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            asChild
            className="h-7 border-teal-800/30 bg-white px-2.5 text-teal-950 hover:bg-teal-100/80 dark:border-teal-200/40 dark:bg-transparent dark:text-teal-50 dark:hover:bg-teal-900"
          >
            <Link href={appSiteHref("/auth/signin")}>Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
