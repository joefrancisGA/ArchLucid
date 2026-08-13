/** Buyer/docs scan targets for specialty help chrome claim honesty (TB-1415 / M-251). */
export const SPECIALTY_HELP_CHROME_HONESTY_SCAN_FILES: readonly string[] = [
  "docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
  "docs/go-to-market/PRODUCT_DATASHEET.md",
  "docs/go-to-market/POSITIONING.md",
  "docs/go-to-market/COMPETITIVE_POSITIONING.md",
  "docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md",
  "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
  "docs/go-to-market/COMPETITIVE_LANDSCAPE.md",
  "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md",
  "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md",
] as const;

/**
 * Slugs that must remain in the ≤~50 inventory until the owning cluster ships Done (TB-1415).
 * Remove a slug here only when `clusterDone` is true in `specialty-help-chrome-below-50-inventory.ts`.
 */
export const SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS: readonly string[] = [
  "developer-troubleshooting",
  "api-contracts",
  "configuration-reference",
  "evaluator-workbook",
  "first-hour-operator-path",
  "procurement",
] as const;

/** Lowercase phrases that must not appear affirmatively in buyer copy (TB-1415). */
export const BANNED_SPECIALTY_HELP_CHROME_CLAIM_PHRASES: readonly string[] = [
  "all help is specialty-guided",
  "every help route has specialty chrome",
  "all /help routes are specialty-guided",
  "product help is specialty-guided",
  "start-cta ready across all help",
  "tb-735 gates all technical help",
  "all technical help is admin-gated",
  "every technical-documentation slug is admin-gated",
  "all technical-documentation is gated",
] as const;

export const SPECIALTY_HELP_CHROME_HONESTY_ALLOWLIST_MARKER =
  "specialty-help-chrome-honesty: allow" as const;

export const SPECIALTY_HELP_CHROME_HONESTY_NEGATION_MARKERS: readonly string[] = [
  "do not",
  "don't",
  "must not",
  "never ",
  "not claim",
  "not promise",
  "not cover",
  "forbidden",
  "do not claim",
  "anti-pattern",
  "too strong",
  "confirm claims",
  "claims of",
  "m-251",
  "tb-1414",
  "tb-1415",
  "tb-735",
  SPECIALTY_HELP_CHROME_HONESTY_ALLOWLIST_MARKER,
  "| ",
  '"all help',
  "“all help",
  '"specialty-guided',
  "“specialty-guided",
] as const;

export function lineAffirmsBannedSpecialtyHelpChromeClaim(line: string): string | null {
  const lineLower = line.toLowerCase();

  if (lineLower.includes(SPECIALTY_HELP_CHROME_HONESTY_ALLOWLIST_MARKER)) {
    return null;
  }

  for (const phrase of BANNED_SPECIALTY_HELP_CHROME_CLAIM_PHRASES) {
    const index = lineLower.indexOf(phrase);

    if (index < 0) {
      continue;
    }

    const prefix = lineLower.slice(0, index);

    if (
      SPECIALTY_HELP_CHROME_HONESTY_NEGATION_MARKERS.some((marker) => prefix.includes(marker))
    ) {
      continue;
    }

    return phrase;
  }

  return null;
}

export function sourceContainsAffirmativeSpecialtyHelpChromeOverclaim(source: string): string | null {
  for (const line of source.split(/\r?\n/)) {
    const matched = lineAffirmsBannedSpecialtyHelpChromeClaim(line);

    if (matched !== null) {
      return matched;
    }
  }

  return null;
}
