import { redirect } from "next/navigation";

import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

import { RecommendationLearningOpsPageClient } from "./_sections/RecommendationLearningOpsPageClient";
import { loadRecommendationLearningOpsPageData } from "./_sections/load-recommendation-learning-ops-page-data";

export default async function RecommendationLearningOpsPage() {
  const loaded = await loadRecommendationLearningOpsPageData();

  if (loaded.kind === "redirect-demo") {
    redirect("/");
  }

  return (
    <RecommendationLearningOpsPageClient
      initialStatus={loaded.status}
      initialProfile={loaded.profile}
      initialHistory={loaded.history}
      initialFailure={loaded.failure}
    />
  );
}

export { RECOMMENDATION_LEARNING_CANONICAL_PATH };
