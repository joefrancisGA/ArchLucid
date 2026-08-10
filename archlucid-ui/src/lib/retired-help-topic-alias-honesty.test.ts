import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELP_TOPIC_PERMANENT_REDIRECTS,
  resolveHelpTopicPermanentRedirect,
} from "@/lib/help-topic-permanent-redirects";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";

const RETIRED_HELP_TOPIC_SLUGS = Object.keys(HELP_TOPIC_PERMANENT_REDIRECTS);

/** Hyphen bookmark paths that redirect to slash canonicals (TB-748). */
const REDIRECT_ONLY_HYPHEN_CLOUD_HELP_PATHS = [
  "/help/cloud-connections-azure",
  "/help/cloud-connections-aws",
  "/help/cloud-connections-gcp",
] as const;

const BUYER_HELP_DEEP_LINK_SURFACES = [
  "src/lib/help-search-panel-catalog.ts",
  "src/lib/help-markdown-presentation.ts",
  "src/lib/configuration-reference-help-guide-content.ts",
  "src/lib/users-and-roles-help-evidence-copy.ts",
  "src/lib/azure-boards-help-evidence-copy.ts",
  "src/lib/authentication-sign-in-help-evidence-copy.ts",
  "src/lib/scope-help-evidence-copy.ts",
  "src/lib/enterprise-onboarding-hub-steps.ts",
] as const;

function retiredHelpBookmarkPath(slug: string): string {
  return `/help/${slug}`;
}

describe("retired help topic alias honesty (Batch D)", () => {
  it.each(RETIRED_HELP_TOPIC_SLUGS)(
    "permanently redirects retired slug %s and omits it from the registry",
    (slug) => {
      const redirectTarget = HELP_TOPIC_PERMANENT_REDIRECTS[slug];

      expect(resolveHelpTopicPermanentRedirect(slug)).toBe(redirectTarget);
      expect(inAppHelpHref(slug)).toBe(redirectTarget);
      expect(getProductDocumentationEntry(slug)).toBeNull();
    },
  );

  it.each(BUYER_HELP_DEEP_LINK_SURFACES)(
    "keeps %s free of retired help bookmark paths",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const slug of RETIRED_HELP_TOPIC_SLUGS) {
        expect(source, `${relativePath} must not deep-link ${retiredHelpBookmarkPath(slug)}`).not.toContain(
          retiredHelpBookmarkPath(slug),
        );
      }

      for (const legacyPath of REDIRECT_ONLY_HYPHEN_CLOUD_HELP_PATHS) {
        expect(source, `${relativePath} must not deep-link ${legacyPath}`).not.toContain(legacyPath);
      }
    },
  );
});
