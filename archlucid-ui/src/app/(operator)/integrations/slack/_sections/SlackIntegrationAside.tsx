"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseSlackPlatformNotesOpenFromSearch,
  slackPlatformNotesDisclosureHrefFromSearch,
} from "@/lib/integrations/slack-platform-notes-disclosure-url";
import {
  SLACK_CONFIGURATION_STATUS_ASIDE_TITLE,
  SLACK_INTEGRATION_SECURITY_NOTE,
  SLACK_SECURITY_ASIDE_TITLE,
  SLACK_SETUP_PROGRESS_TITLE,
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
import {
  resolveSlackIntegrationConnectSteps,
  resolveSlackIntegrationEmphasizedStepId,
} from "@/lib/slack-integration-connect-checklist";
import { cn } from "@/lib/utils";

type SlackIntegrationAsideProps = {
  readonly className?: string;
  readonly loading: boolean;
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
  readonly showOperatorNotes: boolean;
};

export function SlackIntegrationAside(props: SlackIntegrationAsideProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/slack";
  const searchParams = useSearchParams();
  const slackPlatformNotesOpenParam = searchParams.get("slackPlatformNotesOpen");
  const [platformNotesOpen, setPlatformNotesOpenState] = useState(() =>
    parseSlackPlatformNotesOpenFromSearch(slackPlatformNotesOpenParam),
  );

  const syncPlatformNotesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(slackPlatformNotesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setPlatformNotesOpenState(parseSlackPlatformNotesOpenFromSearch(slackPlatformNotesOpenParam));
  }, [slackPlatformNotesOpenParam]);

  const statusLabel = props.loading
    ? "Loading"
    : slackIntegrationConfigurationStatusLabel(props.activeDestinationCount);
  const statusKind = props.loading ? "neutral" : slackIntegrationConfigurationStatusTagKind(props.activeDestinationCount);
  const checklistInput = {
    totalDestinationCount: props.totalDestinationCount,
    activeDestinationCount: props.activeDestinationCount,
    formTestSucceeded: props.formTestSucceeded,
  };
  const connectSteps = resolveSlackIntegrationConnectSteps(checklistInput);
  const emphasizedStepId = resolveSlackIntegrationEmphasizedStepId(checklistInput);

  return (
    <aside
      className={cn("space-y-4", props.className)}
      data-testid="slack-integration-aside"
      data-operator-side-rail-kind="none"
    >
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_CONFIGURATION_STATUS_ASIDE_TITLE}</h2>
        <div className="mt-3">
          <StatusTag kind={statusKind} label={statusLabel} data-testid="slack-aside-configuration-status" />
        </div>
      </div>

      <IntegrationConnectChecklist
        title={SLACK_SETUP_PROGRESS_TITLE}
        steps={connectSteps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="slack"
      />

      <div className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{SLACK_SECURITY_ASIDE_TITLE}</h2>
        <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_SECURITY_NOTE}
        </p>
      </div>

      {props.showOperatorNotes ? (
        <CollapsibleSection
          title="Platform administrator notes"
          sectionTestId="slack-operator-notes"
          open={platformNotesOpen}
          onToggle={setPlatformNotesOpen}
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {props.activeDestinationCount} of {props.totalDestinationCount} Slack destinations are active for this
            workspace.
          </p>
        </CollapsibleSection>
      ) : null}
    </aside>
  );
}
