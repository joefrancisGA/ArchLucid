import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help/help-topic-permanent-redirects";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  retiredHelpTopicAliasHonestyGuardEntries,
  retiredHelpTopicSlugFromPath,
} from "@/lib/ui-route-traffic-retired-help-topic-aliases";

const MANIFEST_RETIRED_HELP_PATHS = retiredHelpTopicAliasHonestyGuardEntries().map(
  (entry) => entry.retiredPath,
);

/** Hyphen bookmark paths superseded by slash canonicals in `inAppHelpHref`. */
const LEGACY_HYPHEN_CLOUD_HELP_PATHS = [
  "/help/cloud-connections-azure",
  "/help/cloud-connections-aws",
  "/help/cloud-connections-gcp",
] as const;

const GLOBAL_BUYER_HELP_DEEP_LINK_SURFACES = [
  "src/lib/help/help-search-panel-catalog.ts",
  "src/lib/help/help-markdown-presentation.ts",
  "src/lib/configuration-reference-help-guide-content.ts",
  "src/lib/users-and-roles-help-evidence-copy.ts",
  "src/lib/azure-boards-help-evidence-copy.ts",
  "src/lib/authentication-sign-in-help-evidence-copy.ts",
  "src/lib/scope-help-evidence-copy.ts",
  "src/lib/enterprise-onboarding-hub-steps.ts",
] as const;

const HELP_CATCH_ALL_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

describe("retired help topic alias honesty (Batch D + F)", () => {
  it("ships with no permanent help topic redirects", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS).toEqual({});
    expect(resolveHelpTopicPermanentRedirect("core-pilot")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("path-chooser")).toBeNull();
  });

  it("does not use permanentRedirect in the help catch-all page", () => {
    const pageSource = readFileSync(HELP_CATCH_ALL_PAGE_PATH, "utf8");

    expect(pageSource).not.toContain("permanentRedirect(");
    expect(pageSource).not.toContain("resolveHelpTopicPermanentRedirect");
  });

  it.each(GLOBAL_BUYER_HELP_DEEP_LINK_SURFACES)(
    "keeps %s free of retired help bookmark paths",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const retiredPath of MANIFEST_RETIRED_HELP_PATHS) {
        expect(source, `${relativePath} must not deep-link ${retiredPath}`).not.toContain(retiredPath);
      }

      for (const legacyPath of LEGACY_HYPHEN_CLOUD_HELP_PATHS) {
        expect(source, `${relativePath} must not deep-link ${legacyPath}`).not.toContain(legacyPath);
      }
    },
  );

  it.each(
    retiredHelpTopicAliasHonestyGuardEntries().flatMap((entry) => {
      const surfaces = entry.buyerSurfaceGuards ?? [];

      return surfaces.map((surface) => [entry.retiredPath, surface, entry] as const);
    }),
  )("keeps %s free of retired path %s", (retiredPath, relativePath, entry) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    expect(source, `${relativePath} must not deep-link ${retiredPath}`).not.toContain(retiredPath);

    for (const banned of entry.bannedBuyerCopy ?? []) {
      expect(source, `${relativePath} must not contain "${banned}"`).not.toContain(banned);
    }
  });

  it.each(
    retiredHelpTopicAliasHonestyGuardEntries().map(
      (entry) => [retiredHelpTopicSlugFromPath(entry.retiredPath), entry] as const,
    ),
  )("manifest retired slug %s is omitted from the registry without redirects", (slug) => {
    expect(resolveHelpTopicPermanentRedirect(slug)).toBeNull();
    expect(getProductDocumentationEntry(slug)).toBeNull();
  });
});
