"use client";

import { useEffect, useState } from "react";

import { readReviewsListReturnHref } from "@/lib/usability/reviews-list-return-state";

/** Hydrated reviews-list return href for review detail breadcrumbs. */
export function useReviewsListReturnNavHref(defaultHref: string): string {
  const [href, setHref] = useState(defaultHref);

  useEffect(() => {
    setHref(readReviewsListReturnHref());
  }, []);

  return href;
}
