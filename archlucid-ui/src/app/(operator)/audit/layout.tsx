import type { ReactNode } from "react";

export {
  dynamic,
  fetchCache,
  revalidate,
} from "@/lib/next/operator-data-route-policy";

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
