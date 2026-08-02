"use client";

import { EvolutionReviewPageView } from "./EvolutionReviewPageView";
import type { EvolutionReviewPageServerLoad } from "./load-evolution-review-page-data";
import { useEvolutionReviewPage } from "./use-evolution-review-page";

type Props = {
  readonly loaded: EvolutionReviewPageServerLoad;
};

/** Client root for evolution review; data is prefetched in `page.tsx` when not in demo mode. */
export function EvolutionReviewPageClient(props: Props) {
  const model = useEvolutionReviewPage(props.loaded);

  return <EvolutionReviewPageView model={model} />;
}
