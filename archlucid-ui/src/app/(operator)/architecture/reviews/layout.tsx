import type { ReactNode } from "react";

/**
 * Reviews routes load live tenant data via server loaders and client fetches.
 * Avoid force-dynamic on the layout so shared shell segments can reuse cached layout work.
 */
export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return children;
}
