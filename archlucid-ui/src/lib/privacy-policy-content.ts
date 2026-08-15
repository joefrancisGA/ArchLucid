import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
} from "@/lib/help/help-markdown-presentation";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/** Canonical controlled source for public privacy policy wording (legal review diffs target this path). */
export const PRIVACY_POLICY_CONTROLLED_SOURCE_PATH = "docs/go-to-market/PRIVACY_POLICY.md" as const;

const LAST_REVIEWED_PATTERN = /<!--\s*PRIVACY_POLICY_LAST_REVIEWED_UTC:([^>]+)\s*-->/;
const EFFECTIVE_DATE_PATTERN = /\*\*Effective date:\*\*\s*([^\n]+)/;
const LAST_REVIEWED_INLINE_PATTERN = /\*\*Last reviewed \(UTC\):\*\*\s*([^\n]+)/;
const RELATED_DOCUMENTS_HEADING = "## Related documents";

export type PrivacyPolicyMetadata = {
  readonly effectiveDate: string | null;
  readonly lastReviewedUtc: string | null;
  /** Stable identifier for governance — mirrors last-reviewed UTC when present. */
  readonly documentVersion: string;
  readonly sourcePath: typeof PRIVACY_POLICY_CONTROLLED_SOURCE_PATH;
};

export type PrivacyPolicyQuickNavItem = {
  readonly label: string;
  readonly sectionPrefix: string;
};

export type PrivacyPolicyRelatedDocument = {
  readonly title: string;
  readonly purpose: string;
  readonly href: string;
};

export type PrivacyPolicyRevisionEntry = {
  readonly documentVersion: string;
  readonly effectiveDate: string;
  readonly summary: string;
};

/** Published revision log — align entries when the controlled policy changes materially. */
export const PRIVACY_POLICY_REVISION_HISTORY: readonly PrivacyPolicyRevisionEntry[] = [
  {
    documentVersion: "2026-07-25",
    effectiveDate: "2026-07-25",
    summary:
      "Clarified marketing analytics consent, subprocessors, international transfers, and GDPR/CCPA rights wording.",
  },
  {
    documentVersion: "2026-04-26",
    effectiveDate: "2026-04-26",
    summary: "Initial public privacy policy published for archlucid.net and the ArchLucid platform.",
  },
] as const;

export const PRIVACY_POLICY_QUICK_NAV_ITEMS: readonly PrivacyPolicyQuickNavItem[] = [
  { label: "Information we collect", sectionPrefix: "2." },
  { label: "How we use information", sectionPrefix: "3." },
  { label: "Data retention", sectionPrefix: "5." },
  { label: "Your rights", sectionPrefix: "6." },
  { label: "Contact us", sectionPrefix: "13." },
] as const;

export const PRIVACY_POLICY_RELATED_DOCUMENTS: readonly PrivacyPolicyRelatedDocument[] = [
  {
    title: "Cookies and tracking",
    purpose: "Cookie and tracking information in this policy",
    href: "#cookies-and-tracking",
  },
  {
    title: "Data processing addendum",
    purpose: "Customer processing terms",
    href: resolveInAppDocHref("docs/go-to-market/DPA_TEMPLATE.md"),
  },
  {
    title: "Subprocessors",
    purpose: "Current service-provider list",
    href: resolveInAppDocHref("docs/go-to-market/SUBPROCESSORS.md"),
  },
  {
    title: "Trust Center",
    purpose: "Security and compliance information",
    href: "/trust",
  },
  {
    title: "Assurance status",
    purpose: "Assurance engagement and diligence materials",
    href: "/assurance-status",
  },
] as const;

export function parsePrivacyPolicyLastReviewedUtc(markdown: string): string | null {
  const match = markdown.match(LAST_REVIEWED_PATTERN);

  return match !== null ? match[1]!.trim() : null;
}

export function parsePrivacyPolicyEffectiveDate(markdown: string): string | null {
  const match = markdown.match(EFFECTIVE_DATE_PATTERN);

  if (match === null) {
    return null;
  }

  const value = match[1]?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function parsePrivacyPolicyLastReviewedInline(markdown: string): string | null {
  const match = markdown.match(LAST_REVIEWED_INLINE_PATTERN);

  if (match === null) {
    return null;
  }

  const value = match[1]?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function parsePrivacyPolicyMetadata(markdown: string): PrivacyPolicyMetadata {
  const lastReviewedUtc =
    parsePrivacyPolicyLastReviewedUtc(markdown) ?? parsePrivacyPolicyLastReviewedInline(markdown);
  const effectiveDate = parsePrivacyPolicyEffectiveDate(markdown);
  const documentVersion = lastReviewedUtc ?? effectiveDate ?? "unversioned";

  return {
    effectiveDate,
    lastReviewedUtc,
    documentVersion,
    sourcePath: PRIVACY_POLICY_CONTROLLED_SOURCE_PATH,
  };
}

/** Removes page chrome already rendered in the document header (H1, dates, scope blockquote). */
export function stripPrivacyPolicyPageChrome(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length && (lines[i]?.trim().length === 0 || lines[i]?.trimStart().startsWith(">"))) {
    i++;
  }

  if (i < lines.length && /<!--\s*PRIVACY_POLICY_LAST_REVIEWED_UTC:/.test(lines[i] ?? "")) {
    i++;
  }

  while (i < lines.length && lines[i]?.trim().length === 0) {
    i++;
  }

  if (i < lines.length && lines[i]?.startsWith("# ") && !lines[i]?.startsWith("## ")) {
    i++;
  }

  while (i < lines.length && lines[i]?.trim().length === 0) {
    i++;
  }

  if (i < lines.length && lines[i]?.startsWith("**Effective date")) {
    i++;
  }

  while (i < lines.length && lines[i]?.trim().length === 0) {
    i++;
  }

  if (i < lines.length && lines[i]?.startsWith("**Last reviewed")) {
    i++;
  }

  while (i < lines.length && lines[i]?.trim().length === 0) {
    i++;
  }

  if (i < lines.length && lines[i]?.trim() === "---") {
    i++;
  }

  while (i < lines.length && lines[i]?.trim().length === 0) {
    i++;
  }

  return lines.slice(i).join("\n").trim();
}

/** Removes the markdown related-documents table — rendered as a dedicated UI section instead. */
export function stripPrivacyPolicyRelatedDocumentsSection(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const markerIndex = normalized.indexOf(`\n${RELATED_DOCUMENTS_HEADING}`);

  if (markerIndex < 0) {
    return normalized.trim();
  }

  return normalized.slice(0, markerIndex).trim();
}

/** Horizontal rules are section separators in the controlled source — not public page content. */
export function stripPrivacyPolicyHorizontalRules(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim()))
    .join("\n");
}

/**
 * Rewrites repo-relative doc links for the public privacy page and removes leftover `.md` paths.
 * Contributor-only references (Art. 30 note, threat model) become public routes or plain prose.
 */
export function preparePrivacyPolicyMarkdownForPresentation(markdown: string): string {
  const withoutOperatorOnlyRefs = markdown
    .replace(
      /^For operator-facing processing activity records \(GDPR Article 30\), see \[.*?\]\(.*?\)\.\s*$/gim,
      "",
    )
    .replace(
      /see the \[Trust Center\]\((?:[^)]*trust-center\.md)\) and \[System Threat Model\]\([^)]+\)/gi,
      "see the [Trust Center](/trust)",
    )
    .replace(/\[Trust Center\]\([^)]*trust-center\.md[^)]*\)/gi, "[Trust Center](/trust)")
    .replace(/\[[^\]]*\]\([^)]*SECURITY\.md[^)]*\)/gi, "[Assurance status](/assurance-status)")
    .replace(
      /Prior versions will be available in the repository's git history\./gi,
      "Prior versions are retained for compliance review.",
    );

  const rewritten = rewriteHelpMarkdownDocLinks(
    withoutOperatorOnlyRefs,
    PRIVACY_POLICY_CONTROLLED_SOURCE_PATH,
  );

  return sanitizeBareMarkdownFileReferences(rewritten);
}

export function preparePrivacyPolicyBodyMarkdown(markdown: string): string {
  const stripped = stripPrivacyPolicyRelatedDocumentsSection(stripPrivacyPolicyPageChrome(markdown));
  const withoutRules = stripPrivacyPolicyHorizontalRules(stripped);

  return preparePrivacyPolicyMarkdownForPresentation(withoutRules).trim();
}

export function resolvePrivacyPolicyQuickNavLinks(
  headings: readonly HelpMarkdownHeading[],
): ReadonlyArray<{ readonly label: string; readonly href: string }> {
  const links: Array<{ label: string; href: string }> = [];

  for (const item of PRIVACY_POLICY_QUICK_NAV_ITEMS) {
    const heading = headings.find((candidate) => candidate.title.trimStart().startsWith(item.sectionPrefix));

    if (heading !== undefined) {
      links.push({ label: item.label, href: `#${heading.id}` });
    }
  }

  return links;
}

export function resolvePrivacyPolicyRelatedDocuments(
  headings: readonly HelpMarkdownHeading[],
): readonly PrivacyPolicyRelatedDocument[] {
  const cookiesHeading = headings.find((heading) => heading.title.trimStart().startsWith("9."));

  return PRIVACY_POLICY_RELATED_DOCUMENTS.map((document) => {
    if (document.href.startsWith("#") && cookiesHeading !== undefined) {
      return { ...document, href: `#${cookiesHeading.id}` };
    }

    return document;
  });
}

export type PrivacyPolicyPreparedContent = {
  readonly metadata: PrivacyPolicyMetadata;
  readonly bodyMarkdown: string;
  readonly headings: readonly HelpMarkdownHeading[];
  readonly quickNavLinks: ReadonlyArray<{ readonly label: string; readonly href: string }>;
  readonly relatedDocuments: readonly PrivacyPolicyRelatedDocument[];
};
