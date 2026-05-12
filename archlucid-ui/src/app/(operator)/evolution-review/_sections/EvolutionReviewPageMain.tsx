"use client";

import { EvolutionReviewPageView } from "./EvolutionReviewPageView";
import { useEvolutionReviewPage } from "./use-evolution-review-page";

/** Client root for evolution review; `page.tsx` stays a thin server wrapper. */
export function EvolutionReviewPageMain() {
  const model = useEvolutionReviewPage();

  return <EvolutionReviewPageView model={model} />;
}
