import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccountSecuritySettingsEvidenceOrientationStrip,
  AiUsageSettingsEvidenceOrientationStrip,
  AuthDomainsSettingsEvidenceOrientationStrip,
  IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip,
  IdentityProvidersOidcSettingsEvidenceOrientationStrip,
  IdentityProvidersSamlSettingsEvidenceOrientationStrip,
  IdentityProvidersSettingsEvidenceOrientationStrip,
  ModelGovernanceSettingsEvidenceOrientationStrip,
  ScimProvisioningSettingsEvidenceOrientationStrip,
  SsoWizardSettingsEvidenceOrientationStrip,
} from "@/components/evidence-orientation/registry/claim-and-sources-strips";

/**
 * The boilerplate "What this page does not cover" band was removed from administration settings:
 * every clause restated the page header, the shared diligence-package negation, or the follow-up
 * list rendered directly below it. These strips are sources-only now.
 */
const ADMIN_SETTINGS_SOURCES_ONLY_STRIPS: ReadonlyArray<{
  readonly testId: string;
  readonly Strip: () => React.JSX.Element;
}> = [
  { testId: "account-security-settings-claim-discipline", Strip: AccountSecuritySettingsEvidenceOrientationStrip },
  { testId: "auth-domains-settings-claim-discipline", Strip: AuthDomainsSettingsEvidenceOrientationStrip },
  { testId: "model-governance-settings-claim-discipline", Strip: ModelGovernanceSettingsEvidenceOrientationStrip },
  { testId: "ai-usage-settings-claim-discipline", Strip: AiUsageSettingsEvidenceOrientationStrip },
  { testId: "identity-providers-settings-claim-discipline", Strip: IdentityProvidersSettingsEvidenceOrientationStrip },
  {
    testId: "identity-providers-oidc-settings-claim-discipline",
    Strip: IdentityProvidersOidcSettingsEvidenceOrientationStrip,
  },
  {
    testId: "identity-providers-saml-settings-claim-discipline",
    Strip: IdentityProvidersSamlSettingsEvidenceOrientationStrip,
  },
  {
    testId: "identity-providers-diagnostics-settings-claim-discipline",
    Strip: IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip,
  },
  { testId: "scim-provisioning-settings-claim-discipline", Strip: ScimProvisioningSettingsEvidenceOrientationStrip },
  { testId: "sso-wizard-settings-claim-discipline", Strip: SsoWizardSettingsEvidenceOrientationStrip },
];

describe("administration settings evidence strips", () => {
  it.each(ADMIN_SETTINGS_SOURCES_ONLY_STRIPS)(
    "renders $testId as follow-ups only, with no boilerplate negation band",
    ({ testId, Strip }) => {
      render(<Strip />);

      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "What this page does not cover" })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Where to go next" })).toBeInTheDocument();
    },
  );
});
