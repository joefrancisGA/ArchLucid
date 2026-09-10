"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { useWorkingStartHref } from "@/hooks/use-working-start-href";
import { SOURCE_ARCHITECTURE_QUERY_PARAM } from "@/lib/architecture/architecture-routes";

import { ReviewsNewPathSwitcherDeferred } from "./reviews-new-path-switcher-deferred-chunks";
import { ReviewsNewWorkingArchitecturePicker } from "./ReviewsNewWorkingArchitecturePicker";

/**
 * Working `/architecture/reviews/new` without `?path=` follows resolveWorkingStartHref (DA-09).
 * Guided/eval keeps the first-run path switcher.
 * Working guided-intake without `sourceArchitectureId` shows an architecture picker (AO-22).
 */
export function ReviewsNewRouteBody(): React.JSX.Element {
  const evalChrome = useProductionEvalChrome();
  const isWorkingDesk = useProductionDeskChrome();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const sourceArchitectureId = searchParams?.get(SOURCE_ARCHITECTURE_QUERY_PARAM)?.trim() ?? "";
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

  if (isWorkingDesk && pathQuery === "guided-intake" && sourceArchitectureId.length === 0) {
    return <ReviewsNewWorkingArchitecturePicker />;
  }

  return <ReviewsNewPathSwitcherDeferred />;
}
