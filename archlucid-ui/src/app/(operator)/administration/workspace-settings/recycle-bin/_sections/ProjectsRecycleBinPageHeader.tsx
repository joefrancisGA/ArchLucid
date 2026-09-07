"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { PROJECTS_RECYCLE_BIN_PAGE_TITLE } from "@/lib/projects-recycle-bin-page-copy";
import { SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH } from "@/lib/settings-admin-route-paths";

export type ProjectsRecycleBinPageHeaderProps = {
  readonly subtitle: string;
  readonly loading: boolean;
  readonly onRefresh: () => void;
  readonly buyerPolishedShell?: boolean;
  readonly claimDiscipline?: string;
  readonly claimDisciplineTestId?: string;
};

/** Shared Projects recycle bin hero — title, help, and refresh. */
export function ProjectsRecycleBinPageHeader(props: ProjectsRecycleBinPageHeaderProps): React.JSX.Element {
  const buyerPolishedShell = props.buyerPolishedShell ?? false;

  return (
    <OperatorPageHeader
      navHref={SETTINGS_WORKSPACE_SETTINGS_RECYCLE_BIN_PATH}
      title={PROJECTS_RECYCLE_BIN_PAGE_TITLE}
      subtitle={props.subtitle}
      titleTestId="projects-recycle-bin-page-title"
      claimDiscipline={buyerPolishedShell ? props.claimDiscipline : undefined}
      claimDisciplineTestId={props.claimDisciplineTestId}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="projects-recycle-bin-header-actions">
          {buyerPolishedShell ? null : (
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          )}
          <RefreshButton
            busy={props.loading}
            data-testid="projects-recycle-bin-refresh-button"
            onClick={() => {
              props.onRefresh();
            }}
          />
        </div>
      }
    />
  );
}
