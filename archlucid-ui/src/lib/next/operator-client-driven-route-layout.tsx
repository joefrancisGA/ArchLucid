import type { ReactNode } from "react";

/**
 * Pass-through layout for operator routes whose live data is loaded on the client
 * (TanStack Query, streaming, or tab-local fetch). Avoid `force-dynamic` so shared
 * shell segments can reuse cached layout work (TB-2123).
 */
export function OperatorClientDrivenRouteLayout({ children }: { children: ReactNode }) {
  return children;
}
