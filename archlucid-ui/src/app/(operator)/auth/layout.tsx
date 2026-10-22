import type { ReactNode } from "react";

// Keep in sync with `@/lib/next/operator-static-route-policy` — Next 16 requires a literal export here (no re-export).
export const dynamic = "force-static";

/** Auth callback/sign-in pages are static shells; client handles tokens. */
export default function OperatorAuthLayout({ children }: { children: ReactNode }) {
  // Landmark required for live a11y suite (`main` gate) and skip-link targets on Access request shells.
  return <main id="main-content">{children}</main>;
}
