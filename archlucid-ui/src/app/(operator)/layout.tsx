import type { ReactNode } from "react";

import { AppShellClient } from "@/components/AppShellClient";

/** Product UI depends on auth, tenant/workspace scope, and live API — never prerender as static HTML at build. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Operator shell: sidebar, auth, command palette — all authenticated product routes. */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>;
}
