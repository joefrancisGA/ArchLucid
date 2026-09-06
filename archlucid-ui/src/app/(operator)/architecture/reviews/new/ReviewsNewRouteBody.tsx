"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useWorkingStartHref } from "@/hooks/use-working-start-href";

import { ReviewsNewPathSwitcherDeferred } from "./reviews-new-path-switcher-deferred-chunks";

/**
 * Working `/architecture/reviews/new` without `?path=` follows resolveWorkingStartHref (DA-09).
 * Guided/eval keeps the first-run path switcher.
 */
export function ReviewsNewRouteBody(): React.JSX.Element {
  const evalChrome = useProductionEvalChrome();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const workingStart = useWorkingStartHref();

  useEffect(() => {
    if (evalChrome || pathQuery.length > 0) {
      return;
    }

    router.replace(workingStart);
  }, [evalChrome, pathQuery, router, workingStart]);

  if (!evalChrome && pathQuery.length === 0) {
    return (
      <p className="text-al-text-secondary" data-testid="reviews-new-working-redirect" role="status">
        Opening your architecture desk…
      </p>
    );
  }

  return <ReviewsNewPathSwitcherDeferred />;
}
