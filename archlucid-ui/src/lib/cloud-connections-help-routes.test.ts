import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS,
  CLOUD_CONNECTIONS_HELP_REGISTRY_SLUG_BY_PROVIDER,
  CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS,
  cloudConnectionsHelpPathSegmentForRegistrySlug,
  normalizeCloudConnectionsSlashHelpTopicSlug,
} from "@/lib/cloud-connections-help-routes";
import {
  HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS,
  HELP_TOPIC_PERMANENT_REDIRECTS,
} from "@/lib/help/help-topic-permanent-redirects";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";

describe("cloud-connections-help-routes (Batch K)", () => {
  it("maps slash topic segments to registry slugs and back", () => {
    expect(normalizeCloudConnectionsSlashHelpTopicSlug("cloud-connections/azure")).toBe(
      "cloud-connections-azure",
    );
    expect(normalizeCloudConnectionsSlashHelpTopicSlug("cloud-connections/aws")).toBe("cloud-connections-aws");
    expect(normalizeCloudConnectionsSlashHelpTopicSlug("cloud-connections/gcp")).toBe("cloud-connections-gcp");
    expect(cloudConnectionsHelpPathSegmentForRegistrySlug("cloud-connections-azure")).toBe(
      "cloud-connections/azure",
    );
    expect(cloudConnectionsHelpPathSegmentForRegistrySlug("cloud-connections-aws")).toBe("cloud-connections/aws");
    expect(cloudConnectionsHelpPathSegmentForRegistrySlug("cloud-connections-gcp")).toBe("cloud-connections/gcp");
  });

  it("keeps hyphen bookmark redirects aligned with help-topic-permanent-redirects", () => {
    for (const slug of HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS) {
      expect(HELP_TOPIC_PERMANENT_REDIRECTS[slug]).toBe(CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS[slug]);
    }
  });

  it("emits slash canonical hrefs from registry slugs", () => {
    for (const registrySlug of Object.values(CLOUD_CONNECTIONS_HELP_REGISTRY_SLUG_BY_PROVIDER)) {
      const segment = cloudConnectionsHelpPathSegmentForRegistrySlug(registrySlug);

      expect(segment).not.toBeNull();
      expect(inAppHelpHref(registrySlug)).toBe(`/help/${segment}`);
      expect(getProductDocumentationEntry(registrySlug)?.slug).toBe(registrySlug);
    }
  });

  it("matches Python workbook hyphen→slash migrations", () => {
    const catalogSource = readFileSync(
      join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py"),
      "utf8",
    );

    for (const [hyphenSlug, slashHref] of Object.entries(CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS)) {
      expect(catalogSource).toContain(`"/help/${hyphenSlug}": "${slashHref}"`);
    }
  });

  it("documents slash topic segments for help catch-all static params", () => {
    expect(CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS).toEqual([
      "cloud-connections/azure",
      "cloud-connections/aws",
      "cloud-connections/gcp",
    ]);
  });

  it("matches Python workbook cloud slash paths in route catalog discovery", () => {
    const catalogSource = readFileSync(
      join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py"),
      "utf8",
    );

    for (const segment of CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS) {
      expect(catalogSource).toContain("_parse_cloud_connections_help_providers");
      expect(catalogSource).toContain(`"/help/${segment}"`);
    }
  });
});
