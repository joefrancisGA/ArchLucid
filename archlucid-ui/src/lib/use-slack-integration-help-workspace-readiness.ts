"use client";

import { useCallback, useEffect, useState } from "react";

import { listAlertRoutingSubscriptions } from "@/lib/api";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import { isApiRequestError } from "@/lib/api-request-error";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";

const SLACK_CHANNEL_TYPE = "SlackWebhook";

export const SLACK_INTEGRATION_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL = "This workspace";

export type SlackIntegrationHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadForbidden: boolean;
  readonly activeDestinationCount: number;
  readonly configurationStatusLabel: string;
  readonly configurationStatusKind: EnterpriseStatusKind;
  readonly workspaceScopeLabel: string | null;
  readonly loadedAtUtc: string | null;
  readonly reload: () => void;
};

const INITIAL_SNAPSHOT: Omit<SlackIntegrationHelpWorkspaceReadinessSnapshot, "reload"> = {
  loading: true,
  loadFailed: false,
  loadForbidden: false,
  activeDestinationCount: 0,
  configurationStatusLabel: "Loading",
  configurationStatusKind: "neutral",
  workspaceScopeLabel: null,
  loadedAtUtc: null,
};

export function useSlackIntegrationHelpWorkspaceReadiness(): SlackIntegrationHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);

  const reload = useCallback(() => {
    setSnapshot((current) => ({ ...current, loading: true, loadFailed: false, loadForbidden: false }));

    void listAlertRoutingSubscriptions()
      .then((data) => {
        const slackRows = data.filter((row) => row.channelType === SLACK_CHANNEL_TYPE);
        const activeDestinationCount = slackRows.filter((row) => row.isEnabled === true).length;
        const workspaceScopeLabel = readActiveWorkspaceScopeLabel();

        setSnapshot({
          loading: false,
          loadFailed: false,
          loadForbidden: false,
          activeDestinationCount,
          configurationStatusLabel: slackIntegrationConfigurationStatusLabel(activeDestinationCount),
          configurationStatusKind: slackIntegrationConfigurationStatusTagKind(activeDestinationCount),
          workspaceScopeLabel,
          loadedAtUtc: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        if (isApiRequestError(error) && error.httpStatus === 403) {
          setSnapshot({
            loading: false,
            loadFailed: false,
            loadForbidden: true,
            activeDestinationCount: 0,
            configurationStatusLabel: "",
            configurationStatusKind: "needs-attention",
            workspaceScopeLabel: null,
            loadedAtUtc: null,
          });

          return;
        }

        setSnapshot({
          loading: false,
          loadFailed: true,
          loadForbidden: false,
          activeDestinationCount: 0,
          configurationStatusLabel: "Unavailable",
          configurationStatusKind: "needs-attention",
          workspaceScopeLabel: null,
          loadedAtUtc: null,
        });
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...snapshot, reload };
}
