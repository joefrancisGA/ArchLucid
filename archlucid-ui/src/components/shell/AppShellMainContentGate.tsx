"use client";

import type { ReactNode } from "react";

import { DemoStrictNavigationGate } from "@/components/DemoStrictNavigationGate";
import { OperatorRoleGate } from "@/components/operator/OperatorRoleGate";
import { SponsorShellRedirect } from "@/components/SponsorShellRedirect";

type AppShellMainContentGateProps = {
  readonly children: ReactNode;
};

/** Demo, sponsor, and role gates — split off shared operator-shell First Load JS (TB-2118). */
export function AppShellMainContentGate({ children }: AppShellMainContentGateProps): React.JSX.Element {
  return (
    <DemoStrictNavigationGate>
      <SponsorShellRedirect>
        <OperatorRoleGate>{children}</OperatorRoleGate>
      </SponsorShellRedirect>
    </DemoStrictNavigationGate>
  );
}
