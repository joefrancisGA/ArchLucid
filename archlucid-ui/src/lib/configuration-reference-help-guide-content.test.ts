import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_CANONICAL_PATH,
  CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE,
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
  CONFIGURATION_REFERENCE_HELP_SOURCES,
  CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS,
} from "@/lib/configuration-reference-help-guide-content";

describe("configuration-reference-help-guide-content", () => {
  it("keeps primary CTAs on SSO, identity providers, and config summary", () => {
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.href).toBe(
      "/administration/identity/sso-wizard",
    );
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.href).toBe(
      "/administration/identity-providers",
    );
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.href).toBe(
      "/internal/configuration",
    );
    expect(
      Object.prototype.hasOwnProperty.call(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS, "openApiKeys"),
    ).toBe(false);
  });

  it("lists three Admin task sections", () => {
    expect(CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS).toHaveLength(3);
    expect(CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS[0]?.title.toLowerCase()).toContain("identity");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      CONFIGURATION_REFERENCE_HELP_SOURCES.some(
        (link) => link.href === CONFIGURATION_REFERENCE_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
    expect(CONFIGURATION_REFERENCE_HELP_SOURCES.some((link) => link.href.includes("authentication-sign-in"))).toBe(
      true,
    );
  });

  it("states claim discipline without implying certification", () => {
    expect(CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not a certification");
    expect(CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});
