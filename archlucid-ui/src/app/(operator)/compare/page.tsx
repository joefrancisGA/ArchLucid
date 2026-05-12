"use client";

import { Suspense } from "react";

import { CompareForm } from "@/app/(operator)/compare/_sections/CompareForm";
import { CompareSuspenseFallback } from "@/app/(operator)/compare/_sections/CompareSuspenseFallback";

/** Compare page entry point. Wraps CompareForm in Suspense for useSearchParams hydration. */
export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSuspenseFallback />}>
      <CompareForm />
    </Suspense>
  );
}
