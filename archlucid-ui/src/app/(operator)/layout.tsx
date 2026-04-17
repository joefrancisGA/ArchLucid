import type { ReactNode } from "react";

import { AppShellClient } from "@/components/AppShellClient";

/** Operator shell: sidebar, auth, command palette — all authenticated product routes. */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>;
}
