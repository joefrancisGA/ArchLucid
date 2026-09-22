import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_CANONICAL_PATH,
  CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE,
  CONFIGURATION_REFERENCE_HELP_OVERVIEW,
  CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE,
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
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.label).toBe("Open SSO wizard");
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.label).toBe(
      "Open identity providers",
    );
    expect(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openConfigurationSummary.label).toBe(
      "Open configuration summary",
    );
    expect(
      Object.prototype.hasOwnProperty.call(CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS, "openApiKeys"),
    ).toBe(false);
  });

  it("lists three Admin task sections with API key status parked", () => {
    expect(CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS).toHaveLength(3);
    expect(CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS[0]?.title.toLowerCase()).toContain("identity");
    expect(CONFIGURATION_REFERENCE_HELP_TASK_SECTIONS[1]?.status).toEqual({
      kind: "neutral",
      label: "Not available in product",
    });
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

  it("states consolidated claim discipline without implying certification", () => {
    expect(CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.endsWith(".")).toBe(true);
    expect(CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not a certification");
    expect(CONFIGURATION_REFERENCE_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });

  it("keeps subtitle and overview free of stacked negation disclaimers", () => {
    expect(CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE.toLowerCase()).not.toContain("not buyer");
    expect(CONFIGURATION_REFERENCE_HELP_PAGE_SUBTITLE.toLowerCase()).not.toContain("not a certification");
    expect(CONFIGURATION_REFERENCE_HELP_OVERVIEW.toLowerCase()).not.toContain("not buyer");
    expect(CONFIGURATION_REFERENCE_HELP_OVERVIEW.toLowerCase()).not.toContain("not a certification");
  });
});
