"use client";

import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CLOUD_CONNECTIONS_OPTIONAL_NOTE,
  CLOUD_CONNECTIONS_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_PAGE_TITLE,
} from "@/lib/cloud-connections-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CloudConnectionsProviderList } from "./CloudConnectionsProviderList";
import type { CloudConnectionsPageViewModel } from "./use-cloud-connections-page";

export type CloudConnectionsPageShellProps = CloudConnectionsPageViewModel;

export function CloudConnectionsPageShell(props: CloudConnectionsPageShellProps) {
  const { showConnectionContent, cloudConnectSteps, cloudConnectEmphasizedStepId } = props;

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}
      data-testid="cloud-connections-page"
    >
      <PageHeading
        navHref={CLOUD_CONNECTIONS_PATH}
        title={CLOUD_CONNECTIONS_PAGE_TITLE}
        variant="integration"
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {CLOUD_CONNECTIONS_PAGE_SUBTITLE}
            </p>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {CLOUD_CONNECTIONS_OPTIONAL_NOTE}
            </p>
          </>
        }
      />

      {showConnectionContent ? (
        <IntegrationConnectChecklist
          title="Connect cloud inventory"
          steps={cloudConnectSteps}
          emphasizedStepId={cloudConnectEmphasizedStepId}
          testIdPrefix="cloud-connections"
        />
      ) : null}

      <CloudConnectionsEvidenceOrientationStrip />

      <CloudConnectionsProviderList {...props} />
    </OperatorPageContainer>
  );
}
