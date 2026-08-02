import { EvolutionReviewPageClient } from "./_sections/EvolutionReviewPageClient";
import { loadEvolutionReviewPageData } from "./_sections/load-evolution-review-page-data";

export default async function EvolutionReviewPage() {
  const loaded = await loadEvolutionReviewPageData();

  return <EvolutionReviewPageClient loaded={loaded} />;
}
