"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseTeamsPlatformNotesOpenFromSearch,
  teamsPlatformNotesDisclosureHrefFromSearch,
} from "@/lib/integrations/teams-platform-notes-disclosure-url";
import {
  resolveTeamsIntegrationConnectSteps,
  resolveTeamsIntegrationEmphasizedStepId,
} from "@/lib/teams-integration-connect-checklist";
import { TEAMS_INTEGRATION_CONNECT_SECTION_TITLE } from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";

type TeamsIntegrationAsideProps = {
  readonly secretNameConfigured: boolean;
  readonly testSucceeded: boolean;
  readonly showOperatorNotes: boolean;
};

/** Teams setup guidance with a live three-step connect checklist. */
export function TeamsIntegrationAside(props: TeamsIntegrationAsideProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/teams";
  const searchParams = useSearchParams();
  const teamsPlatformNotesOpenParam = searchParams.get("teamsPlatformNotesOpen");
  const [platformNotesOpen, setPlatformNotesOpenState] = useState(() =>
    parseTeamsPlatformNotesOpenFromSearch(teamsPlatformNotesOpenParam),
  );
  const steps = resolveTeamsIntegrationConnectSteps(props);
  const emphasizedStepId = resolveTeamsIntegrationEmphasizedStepId(props);

  const syncPlatformNotesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(teamsPlatformNotesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setPlatformNotesOpenState(parseTeamsPlatformNotesOpenFromSearch(teamsPlatformNotesOpenParam));
  }, [teamsPlatformNotesOpenParam]);

  return (
    <div className="space-y-4" data-testid="teams-integration-aside">
      <IntegrationConnectChecklist
        title={TEAMS_INTEGRATION_CONNECT_SECTION_TITLE}
        steps={steps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix="teams"
      />

      {props.showOperatorNotes ? (
        <CollapsibleSection
          title="Platform administrator notes"
          sectionTestId="teams-operator-notes"
          open={platformNotesOpen}
          onToggle={setPlatformNotesOpen}
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Incoming webhook secret is {props.secretNameConfigured ? "configured" : "not configured"} for this workspace.
            Last connection test {props.testSucceeded ? "succeeded" : "has not succeeded yet"}.
          </p>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
