/**
 * Matches manifest detail {@code <h1>} variants from {@code signed-records/[manifestId]/page.tsx}:
 * operator shell, buyer-polished default, buyer showcase curated headline, and legacy showcase wording.
 */
export const MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN =
  /Finalized architecture (?:review )?package|Architecture review|Claims Intake Modernization — signed manifest|Signed manifest — Claims Intake Modernization Review Package|Sealed review record(?: — (?:Claims Intake Modernization Review Package|architecture review))?|Signed decision record(?: — (?:Claims Intake Modernization Review Package|architecture review))?/i;
