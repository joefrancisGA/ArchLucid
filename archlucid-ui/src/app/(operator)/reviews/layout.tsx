import type { ReactNode } from "react";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

/** Reviews list and run detail always load scoped live API data. */
export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return children;
}
