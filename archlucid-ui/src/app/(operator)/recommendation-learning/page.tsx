import { redirect } from "next/navigation";

import { RecommendationLearningPageClient } from "./_sections/RecommendationLearningPageClient";
import { loadRecommendationLearningPageData } from "./_sections/load-recommendation-learning-page-data";

export default async function RecommendationLearningPage() {
  const loaded = await loadRecommendationLearningPageData();

  if (loaded.kind === "redirect-demo") {
    redirect("/");
  }

  return <RecommendationLearningPageClient initialProfile={loaded.profile} initialFailure={loaded.failure} />;
}
