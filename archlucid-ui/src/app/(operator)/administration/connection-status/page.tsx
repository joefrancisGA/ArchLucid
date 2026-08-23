import Link from "next/link";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ConnectionStatusEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import { cn } from "@/lib/utils";

export default function AdministrationConnectionStatusPage() {
  return (
    <OperatorPageContainer variant="workflow" className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}>
      <OperatorPageHeader
        navHref={INTEGRATIONS_READINESS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.connectionStatus}
        subtitle="See which integrations are ready, recommended, or optional for this workspace — and what to configure first."
        actions={
          <>
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="connection-status-related-surfaces"
            >
              Related:{" "}
              <Link href={CLOUD_CONNECTIONS_PATH} className={cn(OPERATOR_LINK.inline, "font-medium")}>
                Cloud connections
              </Link>
              {" · "}
              <Link href={INTEGRATIONS_WEBHOOKS_PATH} className={cn(OPERATOR_LINK.inline, "font-medium")}>
                Webhooks
              </Link>
            </p>
            <PageContextualHelpButton />
          </>
        }
      />
      <ConnectionStatusEvidenceOrientationStrip />
      <ConnectorOperationsDashboard />
    </OperatorPageContainer>
  );
}
