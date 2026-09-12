import {
  ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
  ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_NAV_LABEL } from "@/lib/architecture/architecture-workflow-labels";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_OWNER = "SN-029" as const;

/** Save-and-exit scroll target on Working `/architecture/architectures` (IA-002). */
export const SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID =
  "working-portfolio-open-drafts" as const;

/** SN-029 surfaces — Working portfolio draft inventory beside identity list. */
export const SYSTEM_NOT_JOB_WORKING_PORTFOLIO_DRAFT_SURFACES: readonly string[] = [
  "archlucid-ui/src/app/(operator)/architecture/architectures/_sections/ArchitecturesHubListSection.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureWorkingPortfolioDraftsSection.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureDraftListShell.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceSaveActions.tsx",
  "archlucid-ui/src/lib/operator/operator-nav-labels.ts",
];

export const SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_TITLE = "Open drafts" as const;

export const SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SUBTITLE =
  "Saved architecture drafts in this workspace — resume editing from the portfolio, not a deep-link orphan." as const;

export const SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_EMPTY_BODY =
  "No open drafts yet. Use Create architecture in the page header when you are ready to start a new brief." as const;

/** Working save-and-exit lands on the open-drafts band so resume is one click away. */
export function resolveSystemNotJobWorkingPortfolioSaveAndExitHref(): string {
  return `${ARCHITECTURES_LIST_PATH}#${SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID}`;
}

export function resolveSystemNotJobWorkingPortfolioShowsDraftSection(workingMode: boolean): boolean {
  return workingMode;
}

/** Portfolio lists every non-archived draft; identity rows remain the durable desk anchor. */
export function filterSystemNotJobWorkingPortfolioOpenDrafts(
  entries: readonly ArchitectureDraftRegistryEntry[],
): readonly ArchitectureDraftRegistryEntry[] {
  return entries.filter((entry) => entry.customerStatus !== "archived");
}

/** CA-32 / SN-029 — Working nav reaches identities and open drafts on one portfolio page. */
export function resolveSystemNotJobWorkingArchitecturesListNavTitle(): string {
  return `${ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE} — ${ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE} ${ARCHITECTURE_DRAFTS_NAV_LABEL} are listed on this page.`;
}
