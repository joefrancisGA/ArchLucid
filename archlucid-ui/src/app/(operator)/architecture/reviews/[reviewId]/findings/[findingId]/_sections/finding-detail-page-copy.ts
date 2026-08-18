export const FINDING_DETAIL_PRIMARY_CONTENT_ID = "finding-detail-primary-content" as const;

export const FINDING_DETAIL_SKIP_LINK_LABEL = "Skip to finding summary" as const;

export const FINDING_DETAIL_BREADCRUMB_FINDINGS_LABEL = "Findings" as const;

export const FINDING_DETAIL_PAGE_SUBTITLE_BUYER =
  "Disposition-facing summary, recommended actions, and evidence follow-ups for one architecture review finding." as const;

export const FINDING_DETAIL_CLAIM_HEADING = "Disposition summary only" as const;

export function findingDetailPageSubtitle(
  buyerPolishedShell: boolean,
  operatorSubtitle: string,
): string {
  return buyerPolishedShell ? FINDING_DETAIL_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
