import type { ReactNode } from "react";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

/** Pass-through layout that opts child routes into request-time rendering. */
export function OperatorDataRouteLayout({ children }: { children: ReactNode }) {
  return children;
}
