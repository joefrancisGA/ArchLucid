"use client";

import { RecommendationLearningPageView } from "./RecommendationLearningPageView";
import { useRecommendationLearningPage } from "./use-recommendation-learning-page";

export function RecommendationLearningPageMain() {
  const model = useRecommendationLearningPage();

  return <RecommendationLearningPageView model={model} />;
}
