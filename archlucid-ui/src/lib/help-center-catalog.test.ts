import { describe, expect, it } from "vitest";

import {
  getHelpCenterTier,
  HELP_CENTER_FEATURED_SLUGS,
  listHelpCenterDocumentationTopics,
  listHelpCenterGuideTopics,
  listHelpCenterTopics,
} from "@/lib/help-center-catalog";
import {
  HELP_BROWSE_DOCUMENTATION_LABEL,
  HELP_BROWSE_GUIDE_LABEL,
  resolveHelpTopicBrowseLabel,
} from "@/lib/help-center-browse-labels";
import { getProductDocumentationEntry, normalizeHelpTopicSlug } from "@/lib/product-documentation-registry";

describe("help-center-catalog", () => {
  it("keeps the default landing grid to fifteen featured topics", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).toHaveLength(15);
  });

  it("features review-guide on the help landing grid for browse discovery", () => {
    const defaultTopics = listHelpCenterTopics({ showAdvanced: false, isAdmin: false });
    const slugs = defaultTopics.map((entry) => entry.slug);

    expect(slugs).toContain("review-guide");
    expect(HELP_CENTER_FEATURED_SLUGS.indexOf("review-guide")).toBeGreaterThan(
      HELP_CENTER_FEATURED_SLUGS.indexOf("getting-started"),
    );
  });

  it("hides internal topics until advanced is expanded for admins", () => {
    const defaultTopics = listHelpCenterGuideTopics({ showAdvanced: false, isAdmin: false });
    const slugs = defaultTopics.map((entry) => entry.slug);

    expect(slugs).toContain("cloud-connections");
    expect(slugs).not.toContain("cli-usage");

    const adminAdvanced = listHelpCenterGuideTopics({ showAdvanced: true, isAdmin: true }).map((entry) => entry.slug);

    expect(adminAdvanced).not.toContain("cli-usage");
    expect(adminAdvanced).toContain("enterprise-onboarding");
  });

  it("lists technical-documentation on the Documentation tab instead of Guides", () => {
    const architectDocs = listHelpCenterDocumentationTopics({ isAdmin: false }).map((entry) => entry.slug);

    expect(architectDocs).toContain("configuration-reference");
    expect(architectDocs).not.toContain("getting-started");
    expect(architectDocs).not.toContain("cli-usage");

    const adminDocs = listHelpCenterDocumentationTopics({ isAdmin: true }).map((entry) => entry.slug);

    // TB-1250: eng CLI/API contracts are internal-runbook (Admin-gated), not Documentation-tab technical docs.
    expect(adminDocs).not.toContain("cli-usage");
    expect(adminDocs).not.toContain("governance-api-contracts");
    expect(adminDocs).toContain("admin-diagnostics");
  });

  it("resolves browse labels for guides and documentation slugs (TB-734)", () => {
    expect(resolveHelpTopicBrowseLabel("getting-started")).toBe(HELP_BROWSE_GUIDE_LABEL);
    expect(resolveHelpTopicBrowseLabel("configuration-reference")).toBe(HELP_BROWSE_DOCUMENTATION_LABEL);
    expect(resolveHelpTopicBrowseLabel("cli-usage")).toBeNull();
    expect(resolveHelpTopicBrowseLabel("first-value-20-minutes")).toBeNull();
  });

  it("does not expose internal topics to non-admin users even when advanced is expanded", () => {
    const advancedNonAdmin = listHelpCenterTopics({ showAdvanced: true, isAdmin: false });

    expect(advancedNonAdmin.some((entry) => entry.slug === "cli-usage")).toBe(false);
    expect(advancedNonAdmin.some((entry) => entry.slug === "procurement")).toBe(true);
  });

  it("never lists engineering troubleshooting in featured or non-admin help catalogs (TB-1247)", () => {
    expect(HELP_CENTER_FEATURED_SLUGS).not.toContain("developer-troubleshooting");

    const nonAdminTopics = listHelpCenterTopics({ showAdvanced: true, isAdmin: false }).map(
      (entry) => entry.slug,
    );
    const nonAdminGuides = listHelpCenterGuideTopics({ showAdvanced: true, isAdmin: false }).map(
      (entry) => entry.slug,
    );
    const nonAdminDocs = listHelpCenterDocumentationTopics({ isAdmin: false }).map((entry) => entry.slug);

    expect(nonAdminTopics).not.toContain("developer-troubleshooting");
    expect(nonAdminGuides).not.toContain("developer-troubleshooting");
    expect(nonAdminDocs).not.toContain("developer-troubleshooting");
  });
});

describe("help topic slug aliases", () => {
  it("resolves contextual deep-link slugs", () => {
    expect(normalizeHelpTopicSlug("cloud-connections/azure")).toBe("cloud-connections-azure");
    expect(normalizeHelpTopicSlug("cloud-connections/aws")).toBe("cloud-connections-aws");
    expect(normalizeHelpTopicSlug("cloud-connections/gcp")).toBe("cloud-connections-gcp");
    expect(getProductDocumentationEntry("cloud-connections/azure")?.title).toBe("Connect Azure securely");
    expect(getProductDocumentationEntry("users-and-roles")?.slug).toBe("users-and-roles");
    expect(getProductDocumentationEntry("operator-auth-roles")?.slug).toBe("users-and-roles");
  });
});

describe("help center tiers", () => {
  it("classifies engineering runbooks as internal", () => {
    const cli = getProductDocumentationEntry("cli-usage");

    expect(cli).not.toBeNull();
    expect(getHelpCenterTier(cli!)).toBe("internal");
  });
});
