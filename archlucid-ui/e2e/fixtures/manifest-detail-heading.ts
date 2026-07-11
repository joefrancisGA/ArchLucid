/**
 * Matches manifest detail {@code <h1>} variants from {@code manifests/[manifestId]/page.tsx}:
 * operator shell, buyer-polished default, buyer showcase curated headline, and legacy showcase wording.
 */
export const MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN =
  /Finalized architecture (?:review )?package|Architecture review package|Claims Intake Modernization — signed manifest|Signed manifest — Claims Intake Modernization Review Package|Signed decision record(?: — (?:Claims Intake Modernization Review Package|architecture review package))?/i;
