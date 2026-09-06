"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  JIRA_CONNECTION_VERIFICATION_HELP_LABEL,
  JIRA_CREDENTIALS_SECURE_STORAGE_NOTE,
  JIRA_DOCUMENTATION_ASIDE_TITLE,
  JIRA_LATEST_TEST_TITLE,
  JIRA_PERMISSIONS_ASIDE_BODY,
  JIRA_PERMISSIONS_ASIDE_TITLE,
  JIRA_SETUP_PROGRESS_TITLE,
} from "@/lib/jira-integration-page-copy";
import {
  resolveJiraIntegrationConnectSteps,
  resolveJiraIntegrationEmphasizedStepId,
} from "@/lib/jira-integration-connect-checklist";
import type { JiraConnectionStatusPresentation } from "@/lib/jira-integration-present";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import {
  jiraPlatformNotesDisclosureHrefFromSearch,
  parseJiraPlatformNotesOpenFromSearch,
} from "@/lib/integrations/jira-platform-notes-disclosure-url";

type Props = {
  readonly status: JiraConnectionStatusPresentation;
  readonly oauthConnectReady: boolean;
  readonly credentialsReady: boolean;
  readonly connectionVerified: boolean;
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly showOperatorNotes: boolean;
  readonly nativeEnabled: boolean;
};

export function JiraIntegrationAside(props: Props): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const jiraPlatformNotesOpenParam = searchParams.get("jiraPlatformNotesOpen");
  const [platformNotesOpen, setPlatformNotesOpenState] = useState(() =>
    parseJiraPlatformNotesOpenFromSearch(jiraPlatformNotesOpenParam),
  );

  const syncPlatformNotesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(jiraPlatformNotesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPlatformNotesOpen = useCallback(
    (open: boolean) => {
      setPlatformNotesOpenState(open);
      syncPlatformNotesOpenToUrl(open);
    },
    [syncPlatformNotesOpenToUrl],
  );

  useEffect(() => {
    setPlatformNotesOpenState(parseJiraPlatformNotesOpenFromSearch(jiraPlatformNotesOpenParam));
  }, [jiraPlatformNotesOpenParam]);

  const connectSteps = resolveJiraIntegrationConnectSteps({
    oauthConnectReady: props.oauthConnectReady,
    credentialsReady: props.credentialsReady,
    connectionVerified: props.connectionVerified,
  });
  const emphasizedStepId = resolveJiraIntegrationEmphasizedStepId({
    oauthConnectReady: props.oauthConnectReady,
    credentialsReady: props.credentialsReady,
    connectionVerified: props.connectionVerified,
  });

  return (
    <aside
      className="space-y-4"
      data-testid="jira-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <IntegrationConnectChecklist
        title={JIRA_SETUP_PROGRESS_TITLE}
        steps={connectSteps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="jira"
      />

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_PERMISSIONS_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {JIRA_PERMISSIONS_ASIDE_BODY}
        </p>
      </div>

      {props.lastTestAt !== null ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="jira-latest-test"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_LATEST_TEST_TITLE}</h2>
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
                  : "border-neutral-200 text-al-text-primary dark:border-neutral-700 dark:text-neutral-100",
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
          {JIRA_CREDENTIALS_SECURE_STORAGE_NOTE}
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_DOCUMENTATION_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.inline} href={inAppHelpHref("troubleshooting")}>
            Jira integration help
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
            Integration readiness
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF}>
            {JIRA_CONNECTION_VERIFICATION_HELP_LABEL}
          </Link>
        </p>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection
          title="Platform administrator notes"
          sectionTestId="jira-operator-notes"
          open={platformNotesOpen}
          onToggle={setPlatformNotesOpen}
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Outbound ticket creation is {props.nativeEnabled ? "enabled" : "disabled"} for this deployment.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
