/**
 * Splits Evidence-basis detail strings into buyer-facing copy and a technical remainder.
 *
 * `docs/library/UI_DESIGN_SYSTEM.md` § Technical details forbids raw identifiers, manifest versions,
 * and runtime timestamps on normal product surfaces — they belong behind a diagnostics disclosure.
 * The authority API returns these as free-text detail lines, so the split happens here rather than
 * in the component.
 */

import { DELIVERABLES_BUNDLE_LABEL } from "@/lib/usability/canonical-product-terms";

/**
 * Matches ISO-8601 instants, including .NET's 7-digit fractional seconds.
 * Kept as two literals so the stateful global form is never shared with `test`/`exec` callers.
 */
const ISO_TIMESTAMP_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z?)\b/;
const ISO_TIMESTAMP_GLOBAL_PATTERN = new RegExp(ISO_TIMESTAMP_PATTERN.source, "g");

const SEMVER_PATTERN = /\bv\d+\.\d+(?:\.\d+)?\b/i;

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

/** Clause keywords that only make sense to an engineer reading diagnostics. */
const TECHNICAL_CLAUSE_PATTERN =
  /\b(?:bundle id|artifact id|manifest version|graph nodes|linked trace ids|trace ids|correlation id|run id|finding id)\b/i;

const MONTH_ABBREVIATIONS: readonly string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type TrustEvidenceDetailSplit = {
  /** Buyer-safe copy for the primary surface, or null when every clause was technical. */
  readonly display: string | null;
  /** Clauses withheld for the diagnostics disclosure, or null when nothing was withheld. */
  readonly technical: string | null;
};

/**
 * Formats an ISO-8601 instant as a stable, locale-independent UTC string.
 * Locale-independent on purpose: snapshot tests and CI run under varying locales.
 */
export function formatTrustEvidenceInstant(iso: string): string {
  const match = ISO_TIMESTAMP_PATTERN.exec(iso);

  if (match === null) {
    return iso;
  }

  const monthIndex = Number(match[2]) - 1;
  const month = MONTH_ABBREVIATIONS[monthIndex] ?? match[2];
  const day = String(Number(match[3]));
  const suffix = match[7] === "Z" ? " UTC" : "";

  return `${day} ${month} ${match[1]}, ${match[4]}:${match[5]}${suffix}`;
}

/** Rewrites every ISO-8601 instant inside free text to readable form. */
export function humanizeTrustEvidenceInstants(text: string): string {
  return text.replace(ISO_TIMESTAMP_GLOBAL_PATTERN, (instant) => formatTrustEvidenceInstant(instant));
}

/** True when a single clause carries identifiers or versions that belong in diagnostics. */
export function isTechnicalTrustEvidenceClause(clause: string): boolean {
  const trimmed = clause.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return UUID_PATTERN.test(trimmed) || SEMVER_PATTERN.test(trimmed) || TECHNICAL_CLAUSE_PATTERN.test(trimmed);
}

function joinClauses(clauses: readonly string[]): string | null {
  if (clauses.length === 0) {
    return null;
  }

  return clauses.join("; ");
}

/**
 * Partitions a semicolon-delimited detail line. Buyer-facing clauses keep their wording with
 * timestamps humanized; technical clauses are returned verbatim for the diagnostics disclosure.
 */
export function splitTrustEvidenceDetail(detail: string | null | undefined): TrustEvidenceDetailSplit {
  const trimmed = detail?.trim() ?? "";

  if (trimmed.length === 0) {
    return { display: null, technical: null };
  }

  const clauses = trimmed
    .split(";")
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);
  const display: string[] = [];
  const technical: string[] = [];

  for (const clause of clauses) {
    if (isTechnicalTrustEvidenceClause(clause)) {
      technical.push(clause);

      continue;
    }

    display.push(humanizeTrustEvidenceInstants(clause));
  }

  return { display: joinClauses(display), technical: joinClauses(technical) };
}

/** Buyer-safe titles for Evidence-basis fields whose API title is an implementation label. */
export function trustEvidenceFieldTitleForDisplay(title: string): string {
  const trimmed = title.trim();

  if (/bundle id/i.test(trimmed)) {
    return DELIVERABLES_BUNDLE_LABEL;
  }

  return trimmed;
}
