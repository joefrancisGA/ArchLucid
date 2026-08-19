import type { ReactNode } from "react";

// Keep in sync with `@/lib/next/operator-static-route-policy` — Next 16 requires a literal export here (no re-export).
export const dynamic = "force-static";

/** In-app help is static content; no request-time shell policy. */
export default function HelpLayout({ children }: { children: ReactNode }) {
  return children;
}
