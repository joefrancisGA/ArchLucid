"use client";

import { Suspense } from "react";

import { CompareForm } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareForm";
import { CompareSuspenseFallback } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareSuspenseFallback";
import { WorkingPeerCompareRedirect } from "@/components/insights/WorkingPeerCompareRedirect";
import { OperateUnlockOnCompareVisit } from "@/components/usability/OperateUnlockOnCompareVisit";

/** Compare page entry point. Wraps CompareForm in Suspense for useSearchParams hydration. */
export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSuspenseFallback />}>
      <WorkingPeerCompareRedirect />
      <OperateUnlockOnCompareVisit />
      <CompareForm />
    </Suspense>
  );
}
