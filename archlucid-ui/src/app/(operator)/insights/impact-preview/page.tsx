import { EvolutionReviewPageClient } from "./_sections/EvolutionReviewPageClient";
import { loadEvolutionReviewPageData } from "./_sections/load-evolution-review-page-data";

type EvolutionReviewPageProps = {
  readonly searchParams?: Promise<{
    readonly candidateId?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }

  return null;
}

export default async function EvolutionReviewPage(props: EvolutionReviewPageProps = {}) {
  const searchParams = props.searchParams != null ? await props.searchParams : undefined;
  const candidateId = firstSearchParam(searchParams?.candidateId);
  const loaded = await loadEvolutionReviewPageData({ candidateId });

  return <EvolutionReviewPageClient loaded={loaded} />;
}
