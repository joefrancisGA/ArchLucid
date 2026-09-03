"use client";

import { cn } from "@/lib/utils";

import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  CLOUD_CONNECTIONS_OPTIONAL_NOTE,
  CLOUD_CONNECTIONS_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_PAGE_TITLE,
} from "@/lib/cloud-connections-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CloudConnectionsProviderList } from "./CloudConnectionsProviderList";
import { useCloudConnectionsPage } from "./use-cloud-connections-page";

export function CloudConnectionsPageClient() {
  const model = useCloudConnectionsPage();
  const { showConnectionContent, cloudConnectSteps, cloudConnectEmphasizedStepId } = model;

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

      <CloudConnectionsProviderList {...model} />
    </OperatorPageContainer>
  );
}
