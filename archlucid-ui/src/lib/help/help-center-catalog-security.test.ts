import { describe, expect, it } from "vitest";

import {
  getHelpCenterDisplay,
  listHelpCenterFeaturedSlugs,
  listHelpCenterTopics,
} from "@/lib/help/help-center-catalog";
import { HELP_CENTER_SECURITY_FEATURED_SLUGS } from "@/lib/help/help-center-catalog-security";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("help-center-catalog-security", () => {
  it("features security-relevant topics instead of architecture review walkthroughs", () => {
    expect(HELP_CENTER_SECURITY_FEATURED_SLUGS).toContain("cloud-connections");
    expect(HELP_CENTER_SECURITY_FEATURED_SLUGS).toContain("security-trust");
    expect(HELP_CENTER_SECURITY_FEATURED_SLUGS).not.toContain("first-architecture-review");
    expect(HELP_CENTER_SECURITY_FEATURED_SLUGS).not.toContain("review-packages");
  });

  it("lists SecureNow copy on the security help hub grid", () => {
    const topics = listHelpCenterTopics({ showAdvanced: false, isAdmin: false, productLineId: "security" });
    const cloudConnections = topics.find((entry) => entry.slug === "cloud-connections");

    expect(cloudConnections).not.toBeUndefined();
    expect(getHelpCenterDisplay(cloudConnections!, "security").summary).toContain("Azure");
    expect(getHelpCenterDisplay(cloudConnections!, "security").summary).not.toMatch(/\bAWS\b|\bGCP\b/i);
    expect(listHelpCenterFeaturedSlugs("security")).toEqual(HELP_CENTER_SECURITY_FEATURED_SLUGS);
  });

  it("hides AWS and GCP help topics from the SecureNow help hub", () => {
    const topics = listHelpCenterTopics({ showAdvanced: true, isAdmin: true, productLineId: "security" });
    const slugs = topics.map((entry) => entry.slug);

    expect(slugs).not.toContain("cloud-connections-aws");
    expect(slugs).not.toContain("cloud-connections-gcp");
    expect(slugs).toContain("cloud-connections-azure");
  });

  it("keeps ArchLucid company wording in subprocessors security summary", () => {
    const entry = getProductDocumentationEntry("subprocessors");

    expect(entry).not.toBeNull();
    expect(getHelpCenterDisplay(entry!, "security").summary).toContain("ArchLucid");
    expect(getHelpCenterDisplay(entry!, "security").summary).toContain("SecureNow");
  });
});
