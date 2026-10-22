"use client";

import { Suspense } from "react";

import { GraphPageContent } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageContent";
import { GraphSuspenseFallback } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSuspenseFallback";
import { WorkingPeerGraphRedirect } from "@/components/insights/WorkingPeerGraphRedirect";

export default function GraphPage() {
  return (
    <Suspense fallback={<GraphSuspenseFallback />}>
      <WorkingPeerGraphRedirect />
      <GraphPageContent />
    </Suspense>
  );
}
