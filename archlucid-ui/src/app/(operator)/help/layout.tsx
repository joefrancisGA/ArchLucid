import type { ReactNode } from "react";

export { dynamic } from "@/lib/next/operator-static-route-policy";

/** In-app help is static content; no request-time shell policy. */
export default function HelpLayout({ children }: { children: ReactNode }) {
  return children;
}
