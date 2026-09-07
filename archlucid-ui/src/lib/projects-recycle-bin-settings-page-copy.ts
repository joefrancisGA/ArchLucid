import { recycleBinPageDescription } from "@/lib/projects-recycle-bin-payload";

export const PROJECTS_RECYCLE_BIN_SETTINGS_PRIMARY_CONTENT_ID = "projects-recycle-bin-primary-content" as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID = "projects-recycle-bin-first-viewport" as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_TARGET_ID = PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_LINK_LABEL = "Skip to projects recycle bin" as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "projects-recycle-bin-header-claim-discipline" as const;

export const PROJECTS_RECYCLE_BIN_PAGE_SUBTITLE_BUYER =
  "Browse soft-deleted architecture projects in the retention window for procurement walkthroughs — restore actions are hidden in buyer-polished shells." as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_PAGE_LEAD =
  "Read-only inventory of soft-deleted projects scoped to this tenant, including retention timing and audit-trail follow-ups." as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_START_HERE_CARD_TITLE = "Start here" as const;

export const PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_START_HERE_HELPER =
  "Scan deleted project rows and retention dates first. Restore buttons, continue-last-viewed shortcuts, and vocabulary rails are hidden in buyer-polished shells." as const;

export function recycleBinPageSubtitle(buyerPolishedShell: boolean, retentionDays: number | null): string {
  if (buyerPolishedShell) {
    return PROJECTS_RECYCLE_BIN_PAGE_SUBTITLE_BUYER;
  }

  return recycleBinPageDescription(retentionDays);
}
