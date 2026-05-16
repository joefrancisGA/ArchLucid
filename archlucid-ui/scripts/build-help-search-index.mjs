/**
 * Build-time: parses curated Markdown docs into a static search index (no runtime fetch).
 * Writes src/lib/help-index.generated.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_ROOT = join(__dirname, "..");
const REPO_ROOT = join(UI_ROOT, "..");

/** Repo-relative paths; keep small (<500KB index budget). */
const CURATED_DOC_PATHS = [
  "docs/library/PILOT_GUIDE.md",
  "docs/runbooks/TROUBLESHOOTING.md",
  "docs/library/CONFIGURATION_REFERENCE.md",
  "docs/library/CORE_PILOT.md",
  "docs/go-to-market/PROCUREMENT_FAQ.md",
];

/** @typedef {{ docPath: string; docTitle: string; sectionSlug: string; sectionHeading: string; excerpt: string }} HelpDocSearchRecord */

/**
 * @param {string} text
 */
function stripInlineMarkdown(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

/**
 * GitHub-ish slug — stable enough for deep links; may differ from GitHub in edge cases.
 * @param {string} heading
 */
function slugifyHeading(heading) {
  const cleaned = stripInlineMarkdown(heading)
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return cleaned.length > 0 ? cleaned : "section";
}

/**
 * @param {string} raw
 */
function stripLeadingScopeBlock(raw) {
  const lines = raw.split(/\r?\n/);
  let i = 0;

  while (i < lines.length && lines[i].trimStart().startsWith(">")) {
    i += 1;
  }

  while (i < lines.length && lines[i].trim() === "") {
    i += 1;
  }

  return lines.slice(i).join("\n");
}

/**
 * @param {string[]} lines
 * @param {number} startIdx inclusive — line after heading
 */
function collectFirstParagraph(lines, startIdx) {
  const parts = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith("#")) {
      break;
    }

    if (t === "---" || t === "***") {
      break;
    }

    if (t.startsWith("```")) {
      i += 1;

      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        i += 1;
      }

      i += 1;
      continue;
    }

    if (t === "") {
      if (parts.length > 0) {
        break;
      }

      i += 1;
      continue;
    }

    if (t.startsWith("|")) {
      i += 1;
      continue;
    }

    if (/^<[a-z!?]/i.test(t)) {
      i += 1;
      continue;
    }

    parts.push(stripInlineMarkdown(t));

    i += 1;
  }

  let excerpt = parts.join(" ").replace(/\s+/g, " ").trim();

  if (excerpt.length > 320) {
    excerpt = `${excerpt.slice(0, 317)}…`;
  }

  return excerpt;
}

/**
 * @param {string} docPath
 * @param {string} raw
 * @returns {HelpDocSearchRecord[]}
 */
function parseMarkdownDoc(docPath, raw) {
  /** @type {HelpDocSearchRecord[]} */
  const records = [];
  /** @type {Map<string, number>} */
  const slugUseByDoc = new Map();
  const body = stripLeadingScopeBlock(raw);
  const lines = body.split(/\r?\n/);
  let docTitle = docPath.split("/").pop() ?? docPath;
  docTitle = docTitle.replace(/\.md$/i, "");

  /**
   * @param {string} baseSlug
   */
  function allocateSlug(baseSlug) {
    const key = `${docPath}::${baseSlug}`;
    const next = (slugUseByDoc.get(key) ?? 0) + 1;

    slugUseByDoc.set(key, next);

    return next === 1 ? baseSlug : `${baseSlug}-${next}`;
  }

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const h1 = line.match(/^#\s+(.+)\s*$/);

    if (h1) {
      docTitle = stripInlineMarkdown(h1[1].trim());

      const excerpt = collectFirstParagraph(lines, i + 1);

      if (excerpt.length > 0) {
        records.push({
          docPath,
          docTitle,
          sectionSlug: "",
          sectionHeading: `${docTitle} — overview`,
          excerpt,
        });
      }

      i += 1;
      continue;
    }

    const hx = line.match(/^(#{2,3})\s+(.+)\s*$/);

    if (hx) {
      const headingRaw = hx[2].trim();
      const sectionHeading = stripInlineMarkdown(headingRaw);
      const baseSlug = slugifyHeading(headingRaw);
      const sectionSlug = allocateSlug(baseSlug);

      const excerpt = collectFirstParagraph(lines, i + 1);

      records.push({
        docPath,
        docTitle,
        sectionSlug,
        sectionHeading,
        excerpt: excerpt.length > 0 ? excerpt : sectionHeading,
      });

      i += 1;
      continue;
    }

    i += 1;
  }

  if (records.length === 0) {
    records.push({
      docPath,
      docTitle,
      sectionSlug: "",
      sectionHeading: docTitle,
      excerpt: "Documentation excerpt unavailable.",
    });
  }

  return records;
}

function main() {
  /** @type {HelpDocSearchRecord[]} */
  const all = [];

  for (const rel of CURATED_DOC_PATHS) {
    const abs = join(REPO_ROOT, ...rel.split("/"));
    const raw = readFileSync(abs, "utf8");

    all.push(...parseMarkdownDoc(rel, raw));
  }

  const outPath = join(UI_ROOT, "src", "lib", "help-index.generated.ts");
  const serialized = JSON.stringify(all, null, 2);
  const fileBody = `/**
 * Generated by \`scripts/build-help-search-index.mjs\`. Do not edit by hand.
 * Run: \`npm run build:help-index\`
 */
export type HelpDocSearchRecord = {
  docPath: string;
  docTitle: string;
  /** Anchor slug without leading '#'; empty means doc root. */
  sectionSlug: string;
  sectionHeading: string;
  excerpt: string;
};

export const HELP_DOC_SEARCH_RECORDS: readonly HelpDocSearchRecord[] = ${serialized} as const;
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, fileBody, "utf8");

  const bytes = Buffer.byteLength(serialized, "utf8");

  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${outPath} (${all.length} sections, ~${(bytes / 1024).toFixed(1)}KB records JSON in output file).`,
  );

  if (bytes > 500 * 1024) {
    throw new Error(`Help index records exceed 500KB budget (${bytes} bytes). Trim curated docs.`);
  }
}

main();
