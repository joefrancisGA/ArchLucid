import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS,
} from "@/lib/cloud-connections-help-routes";
import {
  HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS,
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help/help-topic-permanent-redirects";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  retiredHelpTopicAliasHonestyGuardEntries,
  retiredHelpTopicSlugFromPath,
} from "@/lib/ui-route-traffic-retired-help-topic-aliases";

const RETIRED_HELP_TOPIC_SLUGS = Object.keys(HELP_TOPIC_PERMANENT_REDIRECTS);
const REGISTRY_RETIRED_HELP_TOPIC_SLUGS = RETIRED_HELP_TOPIC_SLUGS.filter(
  (slug) => !(HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS as readonly string[]).includes(slug),
);

/** Hyphen bookmark paths that redirect to slash canonicals (Batch K). */
const REDIRECT_ONLY_HYPHEN_CLOUD_HELP_PATHS = Object.keys(
  CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS,
).map((slug) => `/help/${slug}`);

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

function retiredHelpBookmarkPath(slug: string): string {
  return `/help/${slug}`;
}

describe("retired help topic alias honesty (Batch D + F)", () => {
  it.each(HELP_TOPIC_BOOKMARK_ONLY_REDIRECT_SLUGS)(
    "permanently redirects hyphen cloud bookmark %s to slash canonical",
    (slug) => {
      const redirectTarget = HELP_TOPIC_PERMANENT_REDIRECTS[slug];

      expect(resolveHelpTopicPermanentRedirect(slug)).toBe(redirectTarget);
      expect(inAppHelpHref(slug)).toBe(redirectTarget);
      expect(getProductDocumentationEntry(slug)?.slug).toBe(slug);
    },
  );

  it.each(REGISTRY_RETIRED_HELP_TOPIC_SLUGS)(
    "permanently redirects retired slug %s and omits it from the registry",
    (slug) => {
      const redirectTarget = HELP_TOPIC_PERMANENT_REDIRECTS[slug];

      expect(resolveHelpTopicPermanentRedirect(slug)).toBe(redirectTarget);
      expect(inAppHelpHref(slug)).toBe(redirectTarget);
      expect(getProductDocumentationEntry(slug)).toBeNull();
    },
  );

  it("resolves permanent redirects before help topic registry lookup in the catch-all page", () => {
    const pageSource = readFileSync(HELP_CATCH_ALL_PAGE_PATH, "utf8");
    const permanentRedirectIndex = pageSource.indexOf("resolveHelpTopicPermanentRedirect");
    const entryLookupIndex = pageSource.indexOf("getProductDocumentationEntry(slug)");

    expect(permanentRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(entryLookupIndex).toBeGreaterThan(permanentRedirectIndex);
    expect(pageSource).toContain("permanentRedirect(permanentRedirectTarget)");
  });

  it.each(GLOBAL_BUYER_HELP_DEEP_LINK_SURFACES)(
    "keeps %s free of retired help bookmark paths",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const slug of REGISTRY_RETIRED_HELP_TOPIC_SLUGS) {
        expect(source, `${relativePath} must not deep-link ${retiredHelpBookmarkPath(slug)}`).not.toContain(
          retiredHelpBookmarkPath(slug),
        );
      }

      for (const legacyPath of REDIRECT_ONLY_HYPHEN_CLOUD_HELP_PATHS) {
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
  )("permanently redirects manifest retired slug %s to its canonical path", (slug, entry) => {
    expect(resolveHelpTopicPermanentRedirect(slug)).toBe(entry.canonicalPath);
    expect(inAppHelpHref(slug)).toBe(entry.canonicalPath);
  });
});

describe("help-topic-permanent-redirects (Batch J merged)", () => {
  it("redirects retired creating-runs bookmarks to review-guide", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("creating-runs")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("review-guide")).toBeNull();
  });

  it("chains creating-runs directly to review-guide without starting-reviews intermediate (TB-1643)", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).toBe("/help/review-guide");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["creating-runs"]).not.toBe("/help/starting-reviews");
    expect(inAppHelpHref("creating-runs")).toBe("/help/review-guide");
    expect(getProductDocumentationEntry("creating-runs")).toBeNull();
  });

  it("redirects retired developer-troubleshooting bookmarks to engineering-troubleshooting (TB-1248)", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["developer-troubleshooting"]).toBe("/help/engineering-troubleshooting");
    expect(resolveHelpTopicPermanentRedirect("developer-troubleshooting")).toBe("/help/engineering-troubleshooting");
    expect(resolveHelpTopicPermanentRedirect("engineering-troubleshooting")).toBeNull();
  });

  it("redirects data-handling-tenant-isolation alias to canonical data-handling", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["data-handling-tenant-isolation"]).toBe("/help/data-handling");
    expect(resolveHelpTopicPermanentRedirect("data-handling-tenant-isolation")).toBe("/help/data-handling");
    expect(resolveHelpTopicPermanentRedirect("data-handling")).toBeNull();
  });

  it("redirects integrations/azure-boards alias to canonical azure-boards help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["integrations/azure-boards"]).toBe("/help/azure-boards");
    expect(resolveHelpTopicPermanentRedirect("integrations/azure-boards")).toBe("/help/azure-boards");
    expect(resolveHelpTopicPermanentRedirect("azure-boards")).toBeNull();
  });

  it("redirects operator-auth-roles alias to canonical users-and-roles help", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["operator-auth-roles"]).toBe("/help/users-and-roles");
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe("/help/users-and-roles");
    expect(resolveHelpTopicPermanentRedirect("users-and-roles")).toBeNull();
  });

  it("redirects Batch A retired help aliases to canonical topics", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["starting-reviews"]).toBe("/help/review-guide");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["evidence-only-review"]).toBe("/help/first-architecture-review");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["product-overview"]).toBe("/help/executive-summary#what-archlucid-is");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["core-pilot"]).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("starting-reviews")).toBe("/help/review-guide");
    expect(resolveHelpTopicPermanentRedirect("evidence-only-review")).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("product-overview")).toBe("/help/executive-summary#what-archlucid-is");
    expect(resolveHelpTopicPermanentRedirect("core-pilot")).toBe("/help/first-architecture-review");
  });

  it("redirects Batch C retired help aliases to canonical topics", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["governance-api-contracts"]).toBe("/help/api-contracts");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["evaluator-workbook"]).toBe("/help/choose-your-next-step");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["first-hour-operator-path"]).toBe("/help/first-architecture-review");
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["first-pilot-path"]).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("governance-api-contracts")).toBe("/help/api-contracts");
    expect(resolveHelpTopicPermanentRedirect("api-contracts")).toBeNull();
    expect(resolveHelpTopicPermanentRedirect("evaluator-workbook")).toBe("/help/choose-your-next-step");
    expect(resolveHelpTopicPermanentRedirect("first-hour-operator-path")).toBe("/help/first-architecture-review");
    expect(resolveHelpTopicPermanentRedirect("first-pilot-path")).toBe("/help/first-architecture-review");
  });

  it("redirects pilot-nav-profile alias to pilot-guide (PIL folded into HP)", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["pilot-nav-profile"]).toBe("/help/pilot-guide");
    expect(resolveHelpTopicPermanentRedirect("pilot-nav-profile")).toBe("/help/pilot-guide");
    expect(inAppHelpHref("pilot-nav-profile")).toBe("/help/pilot-guide");
  });

  it("redirects how-it-works alias to getting-started How ArchLucid works anchor", () => {
    expect(HELP_TOPIC_PERMANENT_REDIRECTS["how-it-works"]).toBe("/help/getting-started#how-archlucid-works");
    expect(resolveHelpTopicPermanentRedirect("how-it-works")).toBe("/help/getting-started#how-archlucid-works");
    expect(resolveHelpTopicPermanentRedirect("getting-started")).toBeNull();
  });
});
