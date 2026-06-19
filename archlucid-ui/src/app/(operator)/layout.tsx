import type { ReactNode } from "react";

import { AppShellClient } from "@/components/AppShellClient";

/** Shell is client-driven; child routes opt into request-time rendering only when needed. */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return <AppShellClient>{children}</AppShellClient>;
}
