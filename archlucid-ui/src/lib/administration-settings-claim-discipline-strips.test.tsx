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

const ADMIN_SETTINGS_CLAIM_DISCIPLINE_STRIPS: ReadonlyArray<{
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

describe("administration settings claim-discipline strips", () => {
  it.each(ADMIN_SETTINGS_CLAIM_DISCIPLINE_STRIPS)(
    "renders $testId with claim discipline and follow-ups",
    ({ testId, Strip }) => {
      render(<Strip />);

      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "What this page does not cover" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Where to go next" })).toBeInTheDocument();
    },
  );
});
