"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT,
  writeFrictionlessTrialSessionEnabled,
} from "@/lib/frictionless-trial-session";

/** Enables a browser-only frictionless trial session and opens the showcase review package. */
export function FrictionlessTrialLauncher() {
  const router = useRouter();

  useEffect(() => {
    writeFrictionlessTrialSessionEnabled(true);
    window.dispatchEvent(new Event(FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT));
    router.replace(`/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
  }, [router]);

  return (
    <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="frictionless-trial-launcher">
      Opening the sample review package…
    </p>
  );
}
