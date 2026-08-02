"use client";

import { Suspense } from "react";

import { GraphPageContent } from "@/app/(operator)/graph/_sections/GraphPageContent";
import { GraphSuspenseFallback } from "@/app/(operator)/graph/_sections/GraphSuspenseFallback";

export default function GraphPage() {
  return (
    <Suspense fallback={<GraphSuspenseFallback />}>
      <GraphPageContent />
    </Suspense>
  );
}
