"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_LIST_CLAIM_DISCIPLINE,
  ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE,
  ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE,
} from "@/lib/architecture/architecture-identity-desk-copy";
import {
  architecturesHubPageSubtitle,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";
import { ARCHITECTURES_LIST_CLAIM_DISCIPLINE } from "@/lib/architectures-list-evidence-copy";

import { ArchitecturesHubBreadcrumb } from "./ArchitecturesHubBreadcrumb";
import { ArchitecturesHubHeaderActions } from "./ArchitecturesHubHeaderActions";

/** Mode-aware hub chrome — Working lists identities; Guided keeps draft-inventory teaching (CA-25 / CA-36). */
export function ArchitecturesHubPageHeader(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const evalChromeShell = useProductionEvalChrome();

  const title = isWorkingMode ? ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE : ARCHITECTURES_HUB_PAGE_TITLE;
  const subtitle = isWorkingMode
    ? ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE
    : architecturesHubPageSubtitle(evalChromeShell);
  const claimDiscipline = isWorkingMode
    ? ARCHITECTURE_IDENTITY_LIST_CLAIM_DISCIPLINE
    : ARCHITECTURES_LIST_CLAIM_DISCIPLINE;

  return (
    <OperatorPageHeader
      title={title}
      subtitle={subtitle}
      claimDiscipline={claimDiscipline}
      claimDisciplineTestId="architectures-hub-claim-discipline"
      navHref={ARCHITECTURES_LIST_PATH}
      headingLevel="h1"
      titleTestId="architectures-hub-page-title"
      subtitleTestId="architectures-hub-page-subtitle"
      breadcrumb={<ArchitecturesHubBreadcrumb />}
      actions={<ArchitecturesHubHeaderActions />}
    />
  );
}
