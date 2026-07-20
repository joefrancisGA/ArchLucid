import { redirect } from "next/navigation";

import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

export default function LegacyRecommendationLearningRedirectPage() {
  redirect(RECOMMENDATION_LEARNING_CANONICAL_PATH);
}
