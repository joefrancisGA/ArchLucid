import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_DELETE_CONFIRM_ACTION_LABEL,
} from "@/lib/architecture/architecture-draft-delete-copy";
import {
  ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL,
  ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT,
} from "@/lib/architecture/architecture-identity-desk-copy";
import {
  ARCHITECTURE_DRAFTS_NAV_LABEL,
  CONTINUE_DRAFT_LABEL,
  VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_HUB_FILTER_DRAFT_LABEL,
  ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER,
  ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN,
} from "@/lib/architectures-hub-copy";
import { OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA } from "@/lib/buyer-copy/operator-home-intent";

const UI_SRC_ROOT = path.join(process.cwd(), "src");

/** Production copy surfaces where bare "draft" must mean architecture draft. */
const ARCHITECTURE_DRAFT_TERMINOLOGY_SURFACE_PATHS = [
  "lib/architecture/architecture-workflow-labels.ts",
  "lib/architectures-hub-copy.ts",
  "lib/architecture/architecture-draft-delete-copy.ts",
  "lib/architecture/architecture-identity-desk-copy.ts",
  "lib/guided-intake-copy.ts",
  "app/(operator)/architecture/reviews/_sections/reviews-hub-copy.ts",
  "lib/buyer-copy/operator-home-intent.ts",
] as const;

const QUOTED_STRING_PATTERN = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

const ARCHITECTURE_PREFIX_PATTERN = /architecture[-\s]+drafts?/i;

function bareDraftNounHitsInQuotedCopy(source: string): string[] {
  const hits: string[] = [];

  for (const quotedMatch of source.matchAll(QUOTED_STRING_PATTERN)) {
    const quoted = quotedMatch[0];
    const inner = quoted.slice(1, -1);

    if (inner.includes("@/") || inner.includes("/") || inner.includes("-draft-")) {
      continue;
    }

    for (const match of inner.matchAll(/\bdrafts?\b/gi)) {
      const index = match.index ?? 0;
      const windowStart = Math.max(0, index - 24);
      const window = inner.slice(windowStart, index + match[0].length);

      if (ARCHITECTURE_PREFIX_PATTERN.test(window)) {
        continue;
      }

      hits.push(match[0]);
    }
  }

  return hits;
}

describe("architecture draft terminology guard", () => {
  it("pins canonical workflow labels to architecture draft nouns", () => {
    expect(CONTINUE_DRAFT_LABEL).toBe("Continue architecture draft");
    expect(VIEW_ALL_DRAFTS_LABEL).toBe("View all architecture drafts");
    expect(ARCHITECTURE_DRAFTS_NAV_LABEL).toBe("Architecture drafts");
    expect(ARCHITECTURE_DRAFT_DELETE_CONFIRM_ACTION_LABEL).toBe("Delete architecture draft");
    expect(ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL).toBe("Current architecture draft");
    expect(ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT).toBe("No open architecture draft");
    expect(OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA).toBe("Resume latest architecture draft");
    expect(ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER).toBe("Search architecture drafts");
    expect(ARCHITECTURES_HUB_FILTER_DRAFT_LABEL).toBe("Architecture draft");
    expect(ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN).toBe("Architecture draft");
  });

  it("avoids bare draft nouns on pinned architecture-draft copy surfaces", () => {
    for (const relativePath of ARCHITECTURE_DRAFT_TERMINOLOGY_SURFACE_PATHS) {
      const source = readFileSync(path.join(UI_SRC_ROOT, relativePath), "utf8");
      const hits = bareDraftNounHitsInQuotedCopy(source);

      expect(hits, `${relativePath} should not use bare draft nouns`).toEqual([]);
    }
  });
});
