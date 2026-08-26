"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { shouldSuppressWizardSessionResumePromptOnReviewsNew } from "@/lib/reviews-new-page-resume-hero";

/** True when an embedded reviews/new wizard must hide its inline resume prompt. */
export function useReviewsNewSuppressWizardResumePrompt(): boolean {
  const searchParams = useSearchParams();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const [suppress, setSuppress] = useState(false);

  useEffect(() => {
    const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

    setSuppress(shouldSuppressWizardSessionResumePromptOnReviewsNew(buyerPolishedShell, pathQuery));
  }, [pathQuery]);

  return suppress;
}
