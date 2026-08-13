/**
 * Build-time: parses curated Markdown docs into a static search index (no runtime fetch).
 * Writes src/lib/help/help-index.generated.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_ROOT = join(__dirname, "..");
const REPO_ROOT = join(UI_ROOT, "..");

/**
 * Keep in sync with `src/lib/help/help-product-language.ts` — normalizes help search excerpts.
 * @param {string} text
 */
function applyHelpTopicProductLanguage(text) {
  let result = text;

  const replacements = [
    [/\bgolden manifests\b/gi, "signed review records"],
    [/\bgolden manifest\b/gi, "signed review record"],
    [/\bmanifest summary\b/gi, "review summary"],
    [/\bmanifest not found\b/gi, "review not found"],
    [/\bmanifest exists\b/gi, "review exists"],
    [/\bfor that manifest\b/gi, "for that review"],
    [/\bmissing manifest\b/gi, "missing review"],
    [/\bmanifest id\b/gi, "review id"],
    [/\bRunId=/g, "ReviewId="],
    [/\brun id\b/gi, "review id"],
    [/\brun not ready\b/gi, "review not ready"],
    [/\barchitecture run\b/gi, "architecture review"],
    [/\bfor this run\b/gi, "for this review"],
    [/\bthe run\b/gi, "the review"],
    [/\bmanifests when governance\b/gi, "signed review records when governance"],
    [/\bcreate runs\b/gi, "create reviews"],
    [/\barchitecture runs\b/gi, "architecture reviews"],
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  result = result.replace(/\/runs\//g, "/architecture/reviews/");
  result = result.replace(/\/runs\b/g, "/architecture/reviews");
  // Lookbehind avoids rewriting already-canonical `/architecture/reviews…` paths.
  result = result.replace(/(?<!\/architecture)\/reviews\//g, "/architecture/reviews/");
  result = result.replace(/(?<!\/architecture)\/reviews\b/g, "/architecture/reviews");
  result = result.replace(/\/architecture\/reviews\/([^)/\s]+)\/manifest\b/g, "/architecture/reviews/$1/architecture");

  return stripProductReleaseVersionLabels(result);
}

/**
 * Keep in sync with `src/lib/help-markdown/markdown-cleanup.ts` — strips product version labels from buyer excerpts.
 * @param {string} markdown
 */
function stripProductReleaseVersionLabels(markdown) {
  return markdown
    .replace(/\*\*\[V1 GA[^\]]*\]\*\*/gi, "**[first-party]**")
    .replace(/\[V1 GA[^\]]*\]/gi, "first-party")
    .replace(/\bV1 GA first-party\b/gi, "first-party")
    .replace(/\bV1 GA\b/gi, "generally available")
    .replace(/\bV1\.1 customer-operated\b/gi, "customer-operated")
    .replace(/\bV1\.1 recipe bridge\b/gi, "recipe bridge")
    .replace(/\bV1\.1\b/gi, "future release")
    .replace(/\bV1-ready\b/gi, "product-ready")
    .replace(/\bV1 pilots?\b/gi, "pilots")
    .replace(/\bfirst-pilot V1\b/gi, "first-pilot")
    .replace(/\bshipped V1\b/gi, "shipped")
    .replace(/\bStatus:\s*V1 GA\b/gi, "Status: generally available")
    .replace(/\bNot V1-required\b/gi, "Not required for pilots")
    .replace(/\bnot V1 defects\b/gi, "not product defects")
    .replace(/\bout of V1\b/gi, "out of current scope")
    .replace(/\bdo not promise GA in V1 pilots\b/gi, "do not promise GA in pilots")
    .replace(/\bUse \(V1\)\b/g, "Use")
    .replace(/\bV1-only\b/gi, "product")
    .replace(/\bV1 REST\b/gi, "REST")
    .replace(/\bV1 vs V1\.1\b/gi, "current product vs future release")
    .replace(/\bV1 window\b/gi, "current product window")
    .replace(/\binternal V1 rollout\b/gi, "internal rollout")
    .replace(/\bV1 scope\b/gi, "product scope")
    .replace(/\bV1 ships\b/gi, "ArchLucid ships")
    .replace(/\bV1 includes\b/gi, "ArchLucid includes")
    .replace(/\bV1 offers\b/gi, "ArchLucid offers")
    .replace(/\bV1 uses\b/gi, "ArchLucid uses")
    .replace(/\bV1 professional services\b/gi, "Professional services")
    .replace(/\bV1 GA —/gi, "")
    .replace(/\bRoadmap \/ V1\.1\b/gi, "Roadmap")
    .replace(/\bGTM V1\.1\b/gi, "GTM")
    .replace(/\bThree lanes \(V1 default\)/gi, "Three lanes")
    .replace(/##\s*V1\s+scalability/gi, "## Scalability")
    .replace(/\{#v1-/gi, "{#")
    .replace(/\bV1\s+scalability\b/gi, "scalability")
    .replace(/\bActive\s+V1\s+control\b/gi, "Active control")
    .replace(/\bnot\s+V1\s+blockers\b/gi, "not product blockers")
    .replace(/\b\(V1 evidence today\)/gi, "(current evidence)")
    .replace(/\bV1\s+evidence\b/gi, "current evidence")
    .replace(/\bdefault\s+V1\s+path\b/gi, "default path")
    .replace(/\bnot\s+a\s+single-switch\s+V1\s+guarantee\b/gi, "not a single-switch product guarantee")
    .replace(/\bAuthoritative\s+V1\b/gi, "Authoritative product")
    .replace(/\bthe\s+\*\*V1\*\*\s+contract\b/gi, "the product contract")
    .replace(/\bV1\s+assurance\b/gi, "current assurance")
    .replace(/\bV1\s+posture\b/gi, "product posture")
    .replace(/\bfor\s+V1\b/gi, "for the product")
    .replace(/\bin\s+V1\b/gi, "in the product")
    .replace(/\bV1\s+describes\b/gi, "ArchLucid describes")
    .replace(/\bnot\s+a\s+V1\s+guarantee\b/gi, "not a product guarantee")
    .replace(/\bV1\s+surface\b/gi, "product surface")
    .replace(/\bV1\s+registry\b/gi, "product registry")
    .replace(/\bV1\s+readiness\b/gi, "product readiness")
    .replace(/\bV1\s+objections\b/gi, "procurement objections")
    .replace(/\bV1\s+claims\b/gi, "product claims")
    .replace(/\bV1\s+required\b/gi, "product-required")
    .replace(/\bV1\s+storage\b/gi, "current storage")
    .replace(/\bV1\s+exposes\b/gi, "ArchLucid exposes")
    .replace(/\bYes\s+—\s+V1\b/gi, "Yes")
    .replace(/\bV1\b/g, "ArchLucid");
}

/**
 * Repo-relative paths; keep small (<500KB index budget).
 * TB-1247: omit eng `TROUBLESHOOTING.md` so the client bundle never ships
 * internal-runbook excerpts (runtime audience filter alone still embedded them).
 */
const CURATED_DOC_PATHS = [
  "docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md",
  "docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md",
  "docs/library/CONFIGURATION_REFERENCE.md",
  "docs/CORE_PILOT.md",
  "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md",
];

/** @typedef {{ docPath: string; docTitle: string; sectionSlug: string; sectionHeading: string; excerpt: string }} HelpDocSearchRecord */

const REVIEW_PACKAGE_LABEL = "Review";
const SIGNED_MANIFEST_LABEL = "Signed review record";
const ARCHITECTURE_REVIEW_LABEL = "Architecture review";

/**
 * Mirrors `help-product-language.ts` for build-time help search excerpts.
 * @param {string} text
 */
function applyHelpProductLanguageToExcerpt(text) {
  let result = text
    .replace(/\breview packages\b/gi, "reviews")
    .replace(/\breview package\b/gi, ARCHITECTURE_REVIEW_LABEL.toLowerCase())
    .replace(/\barchitecture packages\b/gi, `${ARCHITECTURE_REVIEW_LABEL.toLowerCase()}s`)
    .replace(/\barchitecture package\b/gi, ARCHITECTURE_REVIEW_LABEL.toLowerCase())
    .replace(/\bevidence packages\b/gi, "evidence bundles")
    .replace(/\bevidence package\b/gi, "evidence bundle")
    .replace(/\bcannot create runs\b/gi, "cannot create reviews")
    .replace(/\bcreate runs\b/gi, "create reviews")
    .replace(/\barchitecture runs\b/gi, "architecture reviews")
    .replace(/\barchitecture run\b/gi, "architecture review")
    .replace(/\bgolden manifests\b/gi, `${SIGNED_MANIFEST_LABEL.toLowerCase()}s`)
    .replace(/\bgolden manifest\b/gi, SIGNED_MANIFEST_LABEL.toLowerCase())
    .replace(/\bcommitted manifests\b/gi, `committed ${REVIEW_PACKAGE_LABEL.toLowerCase()}s`)
    .replace(/\bcommitted manifest\b/gi, `committed ${REVIEW_PACKAGE_LABEL.toLowerCase()}`)
    .replace(/\bmanifest not found\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} not found`)
    .replace(/\bmanifest exists\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} exists`)
    .replace(/\bfor that manifest\b/gi, `for that ${REVIEW_PACKAGE_LABEL.toLowerCase()}`)
    .replace(/\bArchitecture run execution failed\b/gi, `${ARCHITECTURE_REVIEW_LABEL} execution failed`)
    .replace(/\ba single architecture run\b/gi, `a single ${ARCHITECTURE_REVIEW_LABEL.toLowerCase()}`)
    .replace(/\]\(\/runs\//g, "](/reviews/")
    .replace(/\]\(\/runs\/new\)/g, "](/reviews/new)")
    .replace(/\[(\/runs\/[^\]]+)\]/g, (_match, path) => `[${path.replace(/^\/runs\//, "/reviews/")}]`);

  return stripProductReleaseVersionLabels(result);
}

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
 * @param {string} rawTitle
 * @returns {{ title: string, explicitAnchor: string | null }}
 */
function parseHeadingAnchor(rawTitle) {
  const match = rawTitle.match(/\s*\{#([^}]+)\}\s*$/);

  if (match) {
    return {
      title: rawTitle.replace(/\s*\{#([^}]+)\}\s*$/, "").trim(),
      explicitAnchor: match[1].trim().toLowerCase(),
    };
  }

  return { title: rawTitle.trim(), explicitAnchor: null };
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

  return applyHelpProductLanguageToExcerpt(excerpt);
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
          sectionHeading: applyHelpTopicProductLanguage(`${docTitle} — overview`),
          excerpt: applyHelpTopicProductLanguage(excerpt),
        });
      }

      i += 1;
      continue;
    }

    const hx = line.match(/^(#{2,3})\s+(.+)\s*$/);

    if (hx) {
      const headingRaw = hx[2].trim();
      const { title: headingText, explicitAnchor } = parseHeadingAnchor(headingRaw);
      const sectionHeading = stripInlineMarkdown(headingText);
      const baseSlug = explicitAnchor ?? slugifyHeading(headingText);
      const sectionSlug = allocateSlug(baseSlug);

      const excerpt = collectFirstParagraph(lines, i + 1);

      records.push({
        docPath,
        docTitle,
        sectionSlug,
        sectionHeading: applyHelpTopicProductLanguage(sectionHeading),
        excerpt: applyHelpTopicProductLanguage(excerpt.length > 0 ? excerpt : sectionHeading),
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

  console.log(
    `Wrote ${outPath} (${all.length} sections, ~${(bytes / 1024).toFixed(1)}KB records JSON in output file).`,
  );

  if (bytes > 500 * 1024) {
    throw new Error(`Help index records exceed 500KB budget (${bytes} bytes). Trim curated docs.`);
  }
}

main();
