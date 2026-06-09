"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoExecutiveLandingEnv } from "@/lib/cto-demo-presenter-pack";

/** Redirects packaged demo home to the executive summary landing (#4). */
export function CtoDemoExecutiveLandingRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isCtoDemoExecutiveLandingEnv()) {
      return;
    }

    router.replace(getStartCtoDemoTourHref());
  }, [router]);

  return null;
}
