/**
 * Matches manifest detail {@code <h1>} variants from {@code signed-records/[manifestId]/page.tsx}:
 * operator shell, buyer-polished default, buyer showcase curated headline, and legacy showcase wording.
 */
export const MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN =
  /Finalized architecture (?:review )?package|Architecture review|Enterprise Customer Intake Modernization — signed manifest|Signed manifest — Enterprise Customer Intake Modernization Review Package|Sealed review record(?: — (?:Enterprise Customer Intake Modernization Review Package|architecture review))?|Signed decision record(?: — (?:Enterprise Customer Intake Modernization Review Package|architecture review))?/i;
