"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { persistReviewsListReturnHref } from "@/lib/usability/reviews-list-return-state";

/** Persists the current reviews list URL (including query filters) for breadcrumb return navigation. */
export function ReviewsListReturnStateTracker() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/architecture/reviews") {
      return;
    }

    const query = searchParams.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;

    persistReviewsListReturnHref(href);
  }, [pathname, searchParams]);

  return null;
}
