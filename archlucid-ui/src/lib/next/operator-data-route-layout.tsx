import type { ReactNode } from "react";

/** Pass-through layout that opts child routes into request-time rendering. */
export function OperatorDataRouteLayout({ children }: { children: ReactNode }) {
  return children;
}
