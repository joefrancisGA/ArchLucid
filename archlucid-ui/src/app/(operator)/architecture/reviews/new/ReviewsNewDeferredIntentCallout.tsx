"use client";

import dynamic from "next/dynamic";

const NewReviewIntentCallout = dynamic(
  () => import("./NewReviewIntentCallout").then((module) => module.NewReviewIntentCallout),
  { loading: () => null },
);

/** Query-string intent callout — only relevant for clone/revised deep links. */
export function ReviewsNewDeferredIntentCallout() {
  return <NewReviewIntentCallout />;
}
