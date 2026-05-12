"use client";

import { Suspense } from "react";

import { AskPageContent } from "@/app/(operator)/ask/_sections/AskPageContent";
import { AskSuspenseFallback } from "@/app/(operator)/ask/_sections/AskSuspenseFallback";

export default function AskPage() {
  return (
    <Suspense fallback={<AskSuspenseFallback />}>
      <AskPageContent />
    </Suspense>
  );
}
