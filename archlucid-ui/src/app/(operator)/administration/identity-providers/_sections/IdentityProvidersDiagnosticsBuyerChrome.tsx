"use client";

import { IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Buyer default: mount Sources orientation above the diagnostics workspace body (SEI). */
export function IdentityProvidersDiagnosticsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="identity-providers-diagnostics-orientation-top">
      <IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip />
    </div>
  );
}
