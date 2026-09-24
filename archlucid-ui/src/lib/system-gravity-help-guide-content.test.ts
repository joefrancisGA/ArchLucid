import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { listHelpCenterTopics } from "@/lib/help/help-center-catalog";
import { START_HERE_TOPICS } from "@/lib/help/help-search-panel-catalog-topics";
import { localizeHelpSearchPanelTopics } from "@/lib/help/help-product-copy";
import {
  isHelpSearchTopicExcludedForProductLine,
  isHelpTopicExcludedForProductLine,
} from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING,
  SYSTEM_GRAVITY_HELP_CONCEPT_TILES,
  SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO,
  SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
} from "@/lib/system-gravity-help-guide-content";

const ARCHLUCID_ONLY_HELP_SLUGS = ["system-gravity", "inhabit-the-architecture", "sketch-a-change"] as const;

function helpTopicSlugFromInAppHref(href: string): string | null {
  const normalized = href.trim();

  if (!normalized.startsWith("/help/")) {
    return null;
  }

  const slug = normalized.slice("/help/".length).split(/[?#]/)[0]?.trim() ?? "";

  return slug.length > 0 ? slug : null;
}

function collectSystemGravityGuideCorpus(): string {
  return [
    SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE,
    SYSTEM_GRAVITY_HELP_OVERVIEW,
    SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING,
    SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY,
    SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO,
    ...SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS.map((row) => `${row.keys} ${row.action}`),
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.ifItFails,
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.whatStaysIntact,
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.recover,
    ...SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS.map((row) => `${row.term} ${row.definition}`),
    ...SYSTEM_GRAVITY_HELP_CONCEPT_TILES.map((tile) => `${tile.title} ${tile.body}`),
    ...SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS.map((heading) => heading.title),
  ].join(" ");
}

function assertNoWholeWord(corpus: string, word: string): void {
  expect(corpus).not.toMatch(new RegExp(`\\b${word}\\b`, "i"));
}

describe("system-gravity help guide content (HSY Phase 2)", () => {
  it("excludes ArchLucid-only help slugs from SecureNow hub, topic, and search surfaces", () => {
    for (const slug of ARCHLUCID_ONLY_HELP_SLUGS) {
      expect(isHelpTopicExcludedForProductLine(slug, "security")).toBe(true);
      expect(isHelpTopicExcludedForProductLine(slug, "architecture")).toBe(false);
    }

    expect(isHelpSearchTopicExcludedForProductLine("system-gravity", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("sketch-a-change", "security")).toBe(true);
    expect(isHelpSearchTopicExcludedForProductLine("system-gravity", "architecture")).toBe(false);

    const secureNowTopics = listHelpCenterTopics({
      showAdvanced: true,
      isAdmin: true,
      productLineId: "security",
    }).map((entry) => entry.slug);

    for (const slug of ARCHLUCID_ONLY_HELP_SLUGS) {
      expect(secureNowTopics).not.toContain(slug);
    }

    const secureNowSearchIds = localizeHelpSearchPanelTopics(START_HERE_TOPICS, "security").map((topic) => topic.id);

    expect(secureNowSearchIds).not.toContain("system-gravity");
    expect(secureNowSearchIds).not.toContain("sketch-a-change");
    expect(localizeHelpSearchPanelTopics(START_HERE_TOPICS, "architecture").map((topic) => topic.id)).toContain(
      "system-gravity",
    );
  });

  it("keeps route templates and ArchitectureId in technical disclosure only", () => {
    const tileCorpus = SYSTEM_GRAVITY_HELP_CONCEPT_TILES.map((tile) => tile.body).join(" ");
    const overviewCorpus = SYSTEM_GRAVITY_HELP_OVERVIEW;

    expect(tileCorpus).not.toContain("/architecture/architectures/");
    expect(overviewCorpus).not.toContain("/architecture/architectures/");
    expect(tileCorpus).not.toContain("ArchitectureId");

    expect(SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.join(" ")).toContain("/architecture/architectures/");
    expect(SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.join(" ")).toContain("ArchitectureId");
  });

  it("uses architecture package and sealed-record language without whole-word run, job, or spawn", () => {
    const corpus = collectSystemGravityGuideCorpus();

    assertNoWholeWord(corpus, "run");
    assertNoWholeWord(corpus, "job");
    assertNoWholeWord(corpus, "spawn");

    expect(corpus).toMatch(/architecture package review/i);
    expect(corpus).toMatch(/sealed review record/i);
    expect(corpus.toLowerCase()).not.toContain("github.com");
  });

  it("does not link related help topics excluded for SecureNow on architecture render lines", () => {
    const hrefs = SYSTEM_GRAVITY_HELP_RELATED_LINKS.map((link) => link.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);

    for (const href of hrefs) {
      const slug = helpTopicSlugFromInAppHref(href);
      if (slug !== null) {
        expect(isHelpTopicExcludedForProductLine(slug, "architecture")).toBe(false);
      }
    }
  });

  it("routes SecureNow help topic page through product-line exclusion guard", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "src/app/(operator)/help/[...topic]/page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("isHelpTopicExcludedForProductLine");
    expect(pageSource).toContain("HelpTopicNotFoundView");
  });
});
