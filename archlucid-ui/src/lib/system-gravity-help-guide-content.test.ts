import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { listHelpCenterTopics } from "@/lib/help/help-center-catalog";
import { resolveHelpTopicProductLineExclusionContent } from "@/lib/help/help-topic-product-line-exclusion-copy";
import { START_HERE_TOPICS } from "@/lib/help/help-search-panel-catalog-topics";
import { localizeHelpSearchPanelTopics } from "@/lib/help/help-product-copy";
import {
  isHelpSearchTopicExcludedForProductLine,
  isHelpTopicExcludedForProductLine,
} from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING,
  SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO,
  SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_INTRO,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_PRACTICE_EFFECTS,
  SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_RECORD_EFFECTS,
  SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_BODY,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
  SYSTEM_GRAVITY_HELP_TECHNICAL_INTRO,
} from "@/lib/system-gravity-help-guide-content";

const ARCHLUCID_ONLY_HELP_SLUGS = ["system-gravity", "inhabit-the-architecture", "sketch-a-change"] as const;
const REPO_ROOT = join(process.cwd(), "..");

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
    SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_INTRO,
    SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_RECORD_EFFECTS,
    SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_PRACTICE_EFFECTS,
    SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_BODY,
    SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO,
    ...SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS.map((row) => `${row.keys} ${row.action}`),
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.ifItFails,
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.whatStaysIntact,
    SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.recover,
    ...SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS.map((row) => `${row.term} ${row.definition}`),
    ...SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS.map((heading) => heading.title),
    SYSTEM_GRAVITY_HELP_TECHNICAL_INTRO,
    ...SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
  ].join(" ");
}

function collectSystemGravityCustomerFacingCorpus(): string {
  const registrySource = readFileSync(
    join(process.cwd(), "src/lib/product-documentation-registry-entries-operator-workspace.ts"),
    "utf8",
  );
  const searchSource = readFileSync(join(process.cwd(), "src/lib/help/help-search-panel-catalog-topics.ts"), "utf8");
  const registrySlice = registrySource.slice(
    registrySource.indexOf('"slug": "system-gravity"'),
    registrySource.indexOf('"slug": "sketch-a-change"'),
  );
  const searchSlice = searchSource.slice(
    searchSource.indexOf('id: "system-gravity"'),
    searchSource.indexOf('id: "false-hard-infeasibility"'),
  );

  return [collectSystemGravityGuideCorpus(), registrySlice, searchSlice].join(" ");
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
    expect(isHelpSearchTopicExcludedForProductLine("inhabit-the-architecture", "security")).toBe(true);
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
    expect(secureNowSearchIds).not.toContain("inhabit-the-architecture");
    expect(secureNowSearchIds).not.toContain("sketch-a-change");
    expect(localizeHelpSearchPanelTopics(START_HERE_TOPICS, "architecture").map((topic) => topic.id)).toContain(
      "system-gravity",
    );
  });

  it("ratchets ADR 0098 out of customer-facing HSY surfaces", () => {
    const corpus = collectSystemGravityCustomerFacingCorpus();

    expect(corpus.toLowerCase()).not.toContain("0098");
    expect(corpus).not.toMatch(/\badr\s+0098\b/i);
    expect(corpus).not.toContain("docs/architecture/adrs/0098");
  });

  it("defines desk lock in on-screen key terms", () => {
    const deskLock = SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS.find((row) => row.term === "Desk lock");

    expect(deskLock?.definition).toMatch(/first time/i);
    expect(deskLock?.definition).toMatch(/Alt\+R/i);
  });

  it("keeps route templates and ArchitectureId in technical disclosure only", () => {
    const overviewCorpus = SYSTEM_GRAVITY_HELP_OVERVIEW;

    expect(overviewCorpus).not.toContain("/architecture/architectures/");
    expect(overviewCorpus).not.toContain("ArchitectureId");

    expect(SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.join(" ")).toContain("/architecture/architectures/");
    expect(SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.join(" ")).toContain("ArchitectureId");
    expect(SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS.join(" ")).not.toContain("0098");
  });

  it("uses architecture package and sealed-record language without whole-word run, job, spawn, chrome, exile, or monday", () => {
    const corpus = collectSystemGravityGuideCorpus();

    assertNoWholeWord(corpus, "run");
    assertNoWholeWord(corpus, "job");
    assertNoWholeWord(corpus, "spawn");
    assertNoWholeWord(corpus, "chrome");
    assertNoWholeWord(corpus, "exile");
    assertNoWholeWord(corpus, "monday");

    expect(corpus).toMatch(/architecture package review/i);
    expect(corpus).toMatch(/sealed review record/i);
    expect(corpus).toMatch(/audit trail/i);
    expect(corpus.toLowerCase()).not.toContain("github.com");
    expect(SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO.toLowerCase()).not.toContain("keyboard_shortcuts.md");
  });

  it("aligns Alt+R wording across recover copy and keyboard rows", () => {
    expect(SYSTEM_GRAVITY_HELP_ERROR_RECOVERY.recover).toContain(
      "Open architecture desk — last architecture or portfolio (not the reviews inbox)",
    );
    expect(SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS[0]?.action).toContain(
      "Open architecture desk — last architecture or portfolio (not the reviews inbox)",
    );
    expect(SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS.some((row) => row.keys.includes("Ctrl+K") || row.keys.includes("K"))).toBe(
      true,
    );
  });

  it("does not link related help topics excluded for SecureNow on architecture render lines", () => {
    const hrefs = SYSTEM_GRAVITY_HELP_RELATED_LINKS.map((link) => link.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
    expect(SYSTEM_GRAVITY_HELP_RELATED_LINKS.some((link) => link.label === "Open architecture list")).toBe(false);

    for (const href of hrefs) {
      const slug = helpTopicSlugFromInAppHref(href);
      if (slug !== null) {
        expect(isHelpTopicExcludedForProductLine(slug, "architecture")).toBe(false);
      }
    }
  });

  it("routes SecureNow silent exclusions and product-line metadata guards through help topic page", () => {
    expect(resolveHelpTopicProductLineExclusionContent("system-gravity", "security")).toBeNull();
    expect(resolveHelpTopicProductLineExclusionContent("inhabit-the-architecture", "security")).toBeNull();

    const pageSource = readFileSync(
      join(process.cwd(), "src/app/(operator)/help/[...topic]/page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("isHelpTopicExcludedForProductLine");
    expect(pageSource).toContain("HelpTopicNotFoundView");
    expect(pageSource).toMatch(/generateMetadata[\s\S]*isHelpTopicExcludedForProductLine/);
    expect(pageSource).toMatch(/title:\s*"Help topic not found"/);
  });

  it("preserves repository ADR 0098 guard tests", () => {
    const adrGuardSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/system-gravity-adr-guard.test.ts"),
      "utf8",
    );

    expect(adrGuardSource).toContain("SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH");
    expect(existsSync(join(REPO_ROOT, "docs/architecture/adrs/0098-working-instrument-after-spawn-is-desk.md"))).toBe(true);
  });
});
