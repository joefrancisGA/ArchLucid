"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";

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
      className={cn("border-b border-teal-700/30 bg-teal-950/90 px-4 py-2 text-teal-50", OPERATOR_TYPOGRAPHY.body)}
      data-testid="frictionless-trial-banner"
      role="status"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
        <p className="m-0">
          You are inspecting a sample review — fabricated data only, no sign-in required.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link href="/signup">Start an evaluation</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
