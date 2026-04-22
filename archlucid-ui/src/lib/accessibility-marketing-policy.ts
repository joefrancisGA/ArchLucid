import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Section headings from {@link ../../ACCESSIBILITY.md} that the public marketing page renders verbatim.
 * CI (`assert_marketing_accessibility_in_sync.py`) and `scripts/accessibility-marketing-dump-sections.ts` must stay aligned.
 */
export const ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES = [
  "Target compliance level",
  "Current status",
  "Tooling",
  "Existing accessibility controls",
  "Known exemptions",
  "Review cadence",
] as const;

export type AccessibilityMarketingSyncSectionTitle = (typeof ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES)[number];

/**
 * Loads root `ACCESSIBILITY.md`: monorepo dev/CI uses `../ACCESSIBILITY.md`; Docker copies the same file into
 * `go-to-market-samples/` (see `archlucid-ui/Dockerfile`) so standalone builds can still resolve policy text.
 */
export function readAccessibilityPolicyMarkdown(): string {
  const cwd = process.cwd();

  const dockerPath = join(cwd, "go-to-market-samples", "ACCESSIBILITY.md");
  if (existsSync(dockerPath)) {
    return readFileSync(dockerPath, "utf8").replace(/\r\n/g, "\n");
  }

  const monorepoPath = join(cwd, "..", "ACCESSIBILITY.md");
  if (existsSync(monorepoPath)) {
    return readFileSync(monorepoPath, "utf8").replace(/\r\n/g, "\n");
  }

  throw new Error(
    "ACCESSIBILITY.md not found. Expected go-to-market-samples/ACCESSIBILITY.md (Docker) or ../ACCESSIBILITY.md (monorepo).",
  );
}

export function parseAccessibilityMarkdownSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const heading = /^## (.+)$/gm;
  const matches = [...markdown.matchAll(heading)];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const title = m[1]?.trim();
    if (title === undefined || title.length === 0) {
      continue;
    }

    const start = m.index !== undefined ? m.index + m[0].length : 0;
    const end = i + 1 < matches.length && matches[i + 1].index !== undefined ? matches[i + 1].index! : markdown.length;
    sections.set(title, markdown.slice(start, end).trim());
  }

  return sections;
}

/** First `Last reviewed:` line after the document title (repo-wide policy). */
export function parseLastReviewedLine(markdown: string): string | null {
  const withoutTitle = markdown.replace(/^#\s+[^\n]+\n+/m, "");
  const m = withoutTitle.match(/^Last reviewed:\s*(.+)$/m);
  if (m === null || m[1] === undefined) {
    return null;
  }

  return `Last reviewed: ${m[1].trim()}`;
}

export function requireAccessibilityMarketingSections(
  markdown: string,
): ReadonlyMap<string, string> {
  const sections = parseAccessibilityMarkdownSections(markdown);

  for (const title of ACCESSIBILITY_MARKETING_SYNC_SECTION_TITLES) {
    const body = sections.get(title);
    if (body === undefined || body.length === 0) {
      throw new Error(`ACCESSIBILITY.md is missing required non-empty section: ## ${title}`);
    }
  }

  return sections;
}
