import { permanentRedirect } from "next/navigation";

import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";

/** Legacy Pilot feedback URL — permanently redirects to Internal Operations path. */
export default function LegacyProductLearningRedirectPage(): never {
  permanentRedirect(PRODUCT_LEARNING_PATH);
}
