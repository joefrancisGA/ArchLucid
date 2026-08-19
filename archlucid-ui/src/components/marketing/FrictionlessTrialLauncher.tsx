"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT,
  writeFrictionlessTrialSessionEnabled,
} from "@/lib/frictionless-trial-session";

/** Enables a browser-only frictionless trial session and opens the showcase review. */
export function FrictionlessTrialLauncher() {
  const router = useRouter();

  useEffect(() => {
    writeFrictionlessTrialSessionEnabled(true);
    window.dispatchEvent(new Event(FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT));
    router.replace(`/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
  }, [router]);

  return (
    <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} data-testid="frictionless-trial-launcher">
      Opening the sample review…
    </p>
  );
}
