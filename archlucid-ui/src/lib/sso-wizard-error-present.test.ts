import { describe, expect, it } from "vitest";

import {
  formatSsoWizardActivateError,
  formatSsoWizardDiscoveryError,
} from "@/lib/sso-wizard-error-present";

describe("sso-wizard-error-present", () => {
  it("replaces internal discovery errors with customer-facing copy", () => {
    expect(
      formatSsoWizardDiscoveryError("dbo.TenantIdentityProviderConfigurations missing (HTTP 500)"),
    ).toMatch(/Could not retrieve identity provider metadata/i);
  });

  it("preserves administrator-safe provider messages", () => {
    expect(formatSsoWizardActivateError("Issuer URL is required.")).toBe("Issuer URL is required.");
  });
});
