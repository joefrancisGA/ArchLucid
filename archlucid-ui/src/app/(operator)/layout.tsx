import type { ReactNode } from "react";

import { AppShellClient } from "@/components/AppShellClient";
import { GovernanceModeProvider } from "@/hooks/use-governance-mode";

/** Shell is client-driven; child routes opt into request-time rendering only when needed. */
export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <GovernanceModeProvider>
      <AppShellClient>{children}</AppShellClient>
    </GovernanceModeProvider>
  );
}
