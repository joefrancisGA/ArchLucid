
/**
 * TB-1659 — tenant-isolation help: strip pack-alias / repo-path leakage; buyer-safe three-layer summary.
 */


/**
 * TB-1677 — DPA template help: strip contributor .md / pack-path leakage; in-app trust links.
 */


/**
 * TB-1688 — sponsor-report help (FAQ source): strip contributor FAQ / eng-path leakage.
 */


export const FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE =
  /^## First value in 20 minutes \(time-boxed\)(?:\s*\{#[^}]+\})?\s*$/im;

/**
 * TB-1693 — keep only the first 20-minute time-box section from the full operator runbook.
 */
export function extractFirstValue20MinutesSection(markdown: string): string {
  const headingMatch = FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE.exec(markdown);

  if (headingMatch === null || headingMatch.index === undefined) {
    return markdown;
  }

  const sectionStart = headingMatch.index;
  const afterHeading = markdown.slice(sectionStart);
  const nextMajorSection = afterHeading.search(/\n## (?!#)/);

  if (nextMajorSection < 0) {
    return afterHeading.trimEnd();
  }

  return afterHeading.slice(0, nextMajorSection).trimEnd();
}

/**
 * TB-1693 — first-value-20 help: strip CLI/dotnet / runbook-path leakage; bare archlucid CLI.
 */
/** H2 sections omitted from in-app first-review SE checklist (ops scripts / eng Related). */
export const FIRST_REVIEW_EVIDENCE_OMITTED_SECTION_PREFIXES = [
  "optional tier 2",
  "repeat review",
  "related",
] as const;

/**
 * Drops Tier-2 WIF, PowerShell proof, and eng Related sections from the folded first-review checklist section.
 */


/**
 * First-review help: soften API success signals and map eng .md hrefs to in-app help.
 */


/** H2 sections omitted from in-app CLI usage help (vendor-internal / GTM). */
export const CLI_USAGE_OMITTED_SECTION_PREFIXES = [
  "proof-packet gtm guardrails",
  "archlucid marketplace preflight",
] as const;

/**
 * HCX — drops GTM guardrails and marketplace preflight sections from `/help/cli-usage`.
 */


/**
 * HCX — vendor-internal leakage strip for `/help/cli-usage` (staging hosts, GTM paths, eng DB names).
 */


/**
 * HDX — map eng-library hrefs to in-app Admin/customer help where safe; keep CLI/env triage body.
 */


export function stripFirstValue20ExtractedSectionHeading(markdown: string): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
    index++;
  }

  const firstLine = (lines[index] ?? "").trim();

  if (FIRST_VALUE_20_MINUTES_SECTION_HEADING_RE.test(firstLine)) {
    index++;

    while (index < lines.length && (lines[index] ?? "").trim().length === 0) {
      index++;
    }
  }

  return lines.slice(index).join("\n").trimStart();
}

export function replaceFirstValue20OutsideBacktickSpans(
  text: string,
  proseReplace: (segment: string) => string,
  codeReplace: (inner: string) => string,
): string {
  const parts = text.split(/(`[^`]*`)/g);

  return parts
    .map((part, index) => {
      if (index % 2 === 1 && part.startsWith("`") && part.endsWith("`")) {
        const inner = part.slice(1, -1);

        return `\`${codeReplace(inner)}\``;
      }

      return proseReplace(part);
    })
    .join("");
}

export function applyFirstValue20ProseLeakageReplacements(segment: string): string {
  return segment
    .replace(/\[ROLE_INDEX\.md\]/gi, "[role index]")
    .replace(/\[TROUBLESHOOTING\.md\]/gi, "[Troubleshooting]")
    .replace(/`?archlucid\.json`?/gi, "CLI configuration file")
    .replace(/`?ARCHLUCID_API_KEY`?/gi, "API key environment variable")
    .replace(/`GET \/health\/live`/gi, "health check endpoint")
    .replace(/`?ROLE_INDEX\.md`?/gi, "role index")
    .replace(/ROLE_INDEX\.md/gi, "role index")
    .replace(/`?CANONICAL_FIRST_RUN_PATH\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/CANONICAL_FIRST_RUN_PATH\.md/gi, "/help/first-architecture-review")
    .replace(/`?CORE_PILOT\.md`?/gi, "[Your first architecture review](/help/first-architecture-review)")
    .replace(/CORE_PILOT\.md/gi, "/help/first-architecture-review")
    .replace(/`?PILOT_PREREQUISITES\.md`?/gi, "pilot prerequisites checklist")
    .replace(/PILOT_PREREQUISITES\.md/gi, "pilot prerequisites checklist")
    .replace(/`?FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT\.md`?/gi, "production-like preflight checklist")
    .replace(/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT\.md/gi, "production-like preflight checklist")
    .replace(/`?TROUBLESHOOTING\.md`?/gi, "/help/troubleshooting")
    .replace(/TROUBLESHOOTING\.md/gi, "/help/troubleshooting")
    .replace(
      /`?PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST\.md`?/gi,
      "production-like authentication checklist",
    )
    .replace(/PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST\.md/gi, "production-like authentication checklist")
    .replace(/`?QUALITY_GATE_REJECTION\.md`?/gi, "quality gate rejection guide")
    .replace(/QUALITY_GATE_REJECTION\.md/gi, "quality gate rejection guide")
    .replace(/`?OPERATIONS_LLM_QUOTA\.md`?/gi, "LLM quota operations guide")
    .replace(/OPERATIONS_LLM_QUOTA\.md/gi, "LLM quota operations guide")
    .replace(/`?FIRST_PILOT_EVIDENCE_BUNDLE\.md`?/gi, "first-pilot evidence bundle guide")
    .replace(/FIRST_PILOT_EVIDENCE_BUNDLE\.md/gi, "first-pilot evidence bundle guide")
    .replace(/`?GOLDEN_ACCELERATOR_WALKTHROUGH\.md`?/gi, "golden accelerator walkthrough")
    .replace(/GOLDEN_ACCELERATOR_WALKTHROUGH\.md/gi, "golden accelerator walkthrough")
    .replace(/`?STARTER_PROOF_PACK_CHOOSER\.md`?/gi, "[Specialty walkthroughs](/help/specialty-walkthroughs)")
    .replace(/STARTER_PROOF_PACK_CHOOSER\.md/gi, "/help/specialty-walkthroughs")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "<admin-automation-script>")
    .replace(/artifacts\/[^\s`|)]+/gi, "<output-folder>");
}

export function applyFirstValue20CodeSpanLeakageReplacements(inner: string): string {
  return inner
    .replace(/dotnet run --project ArchLucid\.Cli -- /gi, "archlucid ")
    .replace(/ROLE_INDEX\.md/gi, "role-index")
    .replace(/TROUBLESHOOTING\.md/gi, "troubleshooting")
    .replace(/\.\/scripts\/[^\s)`]*/gi, "<admin-automation-script>")
    .replace(/scripts\/[^\s)`]+/gi, "<admin-automation-script>")
    .replace(/artifacts\/[^\s`|)]+/gi, "<output-folder>");
}



/**
 * TB-1712 — path-chooser help: strip GTM/runbook .md and artifacts/ leakage; in-app trust links.
 */
/** H2 sections omitted from in-app pilot-feedback help (eng PRD / API theater). */
