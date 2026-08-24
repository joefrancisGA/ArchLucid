"use client";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveTeamsIntegrationConnectSteps,
  resolveTeamsIntegrationEmphasizedStepId,
} from "@/lib/teams-integration-connect-checklist";
import { TEAMS_INTEGRATION_CONNECT_SECTION_TITLE } from "@/lib/teams-integration-page-copy";

type TeamsIntegrationAsideProps = {
  readonly secretNameConfigured: boolean;
  readonly testSucceeded: boolean;
};

/** Teams setup guidance with a live three-step connect checklist. */
export function TeamsIntegrationAside(props: TeamsIntegrationAsideProps): React.ReactElement {
  const steps = resolveTeamsIntegrationConnectSteps(props);
  const emphasizedStepId = resolveTeamsIntegrationEmphasizedStepId(props);

  return (
    <div className="space-y-4" data-testid="teams-integration-aside">
      <IntegrationConnectChecklist
        title={TEAMS_INTEGRATION_CONNECT_SECTION_TITLE}
        steps={steps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="teams"
      />
    </div>
  );
}
