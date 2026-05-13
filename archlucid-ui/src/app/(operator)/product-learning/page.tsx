import { redirect } from "next/navigation";

import { ProductLearningPageClient } from "./_sections/ProductLearningPageClient";
import { loadProductLearningPageData } from "./_sections/load-product-learning-page-data";

export default async function ProductLearningPage() {
  const loaded = await loadProductLearningPageData();

  if (loaded.kind === "redirect-demo") {
    redirect("/");
  }

  return <ProductLearningPageClient initialBundle={loaded.bundle} initialFailure={loaded.failure} />;
}
