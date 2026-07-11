"use client";

import { useEffect } from "react";

import { resolveDemoEntryRedirectHref } from "@/lib/demo-entry-redirect";

/**
 * Client redirect for `/demo` — avoids Next.js dev RSC performance `measure` errors when a server
 * page calls `redirect()` before component timing marks complete.
 */
export function DemoEntryRedirect() {
  useEffect(() => {
    window.location.replace(resolveDemoEntryRedirectHref());
  }, []);

  return null;
}
