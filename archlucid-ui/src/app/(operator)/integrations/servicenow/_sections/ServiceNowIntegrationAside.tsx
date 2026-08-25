"use client";

import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_PATH, ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL,
  SERVICENOW_CREDENTIALS_SECURE_STORAGE_NOTE,
  SERVICENOW_DOCUMENTATION_ASIDE_TITLE,
  SERVICENOW_LATEST_TEST_TITLE,
  SERVICENOW_PERMISSIONS_ASIDE_BODY,
  SERVICENOW_PERMISSIONS_ASIDE_TITLE,
  SERVICENOW_SETUP_PROGRESS_TITLE,
} from "@/lib/servicenow-integration-page-copy";
import {
  resolveServiceNowIntegrationConnectSteps,
  resolveServiceNowIntegrationEmphasizedStepId,
} from "@/lib/servicenow-integration-connect-checklist";
import type { ServiceNowConnectionStatusPresentation } from "@/lib/servicenow-integration-present";
import { cn } from "@/lib/utils";

type Props = {
  readonly className?: string;
  readonly status: ServiceNowConnectionStatusPresentation;
  readonly credentialsReady: boolean;
  readonly destinationConfigured: boolean;
  readonly connectionVerified: boolean;
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly showOperatorNotes: boolean;
  readonly nativeEnabled: boolean;
};

export function ServiceNowIntegrationAside(props: Props): React.ReactElement {
  const connectSteps = resolveServiceNowIntegrationConnectSteps({
    credentialsReady: props.credentialsReady,
    destinationConfigured: props.destinationConfigured,
    connectionVerified: props.connectionVerified,
  });
  const emphasizedStepId = resolveServiceNowIntegrationEmphasizedStepId({
    credentialsReady: props.credentialsReady,
    destinationConfigured: props.destinationConfigured,
    connectionVerified: props.connectionVerified,
  });

  return (
    <aside
      className={cn("space-y-4", props.className)}
      data-testid="servicenow-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <IntegrationConnectChecklist
        title={SERVICENOW_SETUP_PROGRESS_TITLE}
        steps={connectSteps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="servicenow"
      />

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_PERMISSIONS_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SERVICENOW_PERMISSIONS_ASIDE_BODY}
        </p>
      </div>

      {props.lastTestAt !== null ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="servicenow-latest-test"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_LATEST_TEST_TITLE}</h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <time dateTime={props.lastTestAt}>{new Date(props.lastTestAt).toLocaleString()}</time>
          </p>
          {props.lastTestSummary ? (
            <p
              role={props.lastTestSuccess === false ? "alert" : "status"}
              className={cn(
                "m-0 mt-2 rounded-md border px-3 py-2",
                OPERATOR_TYPOGRAPHY.helper,
                props.lastTestSuccess === false
                  ? "border-red-200 text-red-800 dark:border-red-900 dark:text-red-200"
                  : "border-teal-200 text-teal-900 dark:border-teal-900 dark:text-teal-100",
              )}
            >
              {props.lastTestSummary}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Security</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SERVICENOW_CREDENTIALS_SECURE_STORAGE_NOTE}
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_DOCUMENTATION_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("troubleshooting")}>
            ServiceNow integration help
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
            Integration readiness
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF}>
            {SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL}
          </Link>
        </p>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection title="Platform administrator notes" sectionTestId="servicenow-operator-notes">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Outbound incident creation is {props.nativeEnabled ? "enabled" : "disabled"} for this deployment.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
