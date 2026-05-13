"use client";

import { Suspense } from "react";

import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

import { ReplayForm } from "./ReplayForm";
import { ReplayPageDemoShell } from "./ReplayPageDemoShell";
import { ReplaySuspenseFallback } from "./ReplaySuspenseFallback";

export function ReplayPageMain() {
  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled()) {
    return <ReplayPageDemoShell />;
  }

  return (
    <Suspense fallback={<ReplaySuspenseFallback />}>
      <ReplayForm />
    </Suspense>
  );
}
