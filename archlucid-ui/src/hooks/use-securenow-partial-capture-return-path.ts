"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Current operator URL for securenowReturnPath on partial-capture cloud connections links. */
export function useSecureNowPartialCaptureReturnPath(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const query = searchParams.toString();

    return query.length > 0 ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
}