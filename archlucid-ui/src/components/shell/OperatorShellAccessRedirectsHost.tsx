"use client";

import { useOperatorShellAccessRedirects } from "@/hooks/useOperatorShellAccessRedirects";

/**
 * Runs operator access redirects while full shell chrome is visible but deferred role gates
 * have not mounted yet (TB-2118 dynamic-import gap).
 */
export function OperatorShellAccessRedirectsHost(): null {
  useOperatorShellAccessRedirects();

  return null;
}
