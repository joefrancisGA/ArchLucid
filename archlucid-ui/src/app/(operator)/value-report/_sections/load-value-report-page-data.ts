/**
 * Value report hub: DOCX / board-pack downloads only — no list GET to prefetch today.
 * Slot stays for future eligibility or tier hints without reshaping the client hook.
 */
export type ValueReportPageServerLoad = Record<string, never>;

export async function loadValueReportPageData(): Promise<ValueReportPageServerLoad> {
  return {};
}
