"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import {
  PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF,
  PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_LABEL,
  PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_HREF,
  PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_LABEL,
  PROJECTS_RECYCLE_BIN_PAGE_TITLE,
} from "@/lib/projects-recycle-bin-page-copy";

export type ProjectsRecycleBinPageHeaderProps = {
  readonly subtitle: string;
  readonly loading: boolean;
  readonly onRefresh: () => void;
};

/** Shared Projects recycle bin hero — Administration wayfinding, title, help, and refresh. */
export function ProjectsRecycleBinPageHeader(props: ProjectsRecycleBinPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={PROJECTS_RECYCLE_BIN_PAGE_TITLE}
      subtitle={props.subtitle}
      titleTestId="projects-recycle-bin-page-title"
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="projects-recycle-bin-page-breadcrumb"
          items={[
            {
              label: PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_LABEL,
              href: PROJECTS_RECYCLE_BIN_BREADCRUMB_ADMINISTRATION_HREF,
            },
            {
              label: PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_LABEL,
              href: PROJECTS_RECYCLE_BIN_BREADCRUMB_WORKSPACE_SETTINGS_HREF,
            },
            { label: PROJECTS_RECYCLE_BIN_PAGE_TITLE },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="projects-recycle-bin-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
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
