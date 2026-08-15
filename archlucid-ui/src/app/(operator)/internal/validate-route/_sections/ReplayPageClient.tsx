"use client";

import { Suspense } from "react";

import type { ReplayPageServerLoadResult } from "./load-replay-page-data";
import { ReplayForm } from "./ReplayForm";
import { ReplayPageDemoShell } from "./ReplayPageDemoShell";
import { ReplaySuspenseFallback } from "./ReplaySuspenseFallback";

type ReplayPageClientProps = {
  readonly loaded: ReplayPageServerLoadResult;
};

export function ReplayPageClient(props: ReplayPageClientProps) {
  const loaded = props.loaded;

  if (loaded.kind === "demo") {
    return <ReplayPageDemoShell />;
  }

  return (
    <Suspense fallback={<ReplaySuspenseFallback />}>
      <ReplayForm />
    </Suspense>
  );
}
