import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store" as const;

/** Reviews list and run detail always load scoped live API data. */
export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return children;
}
