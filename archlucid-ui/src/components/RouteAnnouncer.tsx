"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { getRouteTitle } from "@/lib/route-titles";

/**
 * Announces SPA navigations to assistive tech (<c>aria-live</c> region).
 */
export function RouteAnnouncer() {
  const pathname = usePathname();
  const { productLine } = useProductLine();
  const previousPathname = useRef<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;

      return;
    }

    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    const title = getRouteTitle(pathname, productLine);
    setMessage(`Navigated to ${title}`);
  }, [pathname, productLine]);

  return (
    <div
      data-testid="route-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
