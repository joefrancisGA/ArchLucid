import type { ReactNode } from "react";

export { dynamic } from "@/lib/next/operator-static-route-policy";

/** Auth callback/sign-in pages are static shells; client handles tokens. */
export default function OperatorAuthLayout({ children }: { children: ReactNode }) {
  return children;
}
