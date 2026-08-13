"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchTenantIntegrationsOperations } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { buildIntegrationReadinessSummaryTiles } from "@/lib/connector-readiness-summary";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import {
  CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE,
} from "@/lib/connection-status-help-guide-content";

export const CONNECTION_STATUS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL = "This workspace";

export type ConnectionStatusHelpReadinessMetric = {
  readonly label: string;
  readonly valueLabel: string;
  readonly statusKind: EnterpriseStatusKind;
  readonly href: string;
};

export type ConnectionStatusHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadForbidden: boolean;
  readonly metrics: readonly ConnectionStatusHelpReadinessMetric[];
  readonly workspaceScopeLabel: string | null;
  readonly loadedAtUtc: string | null;
  readonly reload: () => void;
};

const INITIAL_SNAPSHOT: Omit<ConnectionStatusHelpWorkspaceReadinessSnapshot, "reload"> = {
  loading: true,
  loadFailed: false,
  loadForbidden: false,
  metrics: [],
  workspaceScopeLabel: null,
  loadedAtUtc: null,
};

function summaryToneToStatusKind(tone: "healthy" | "attention" | "neutral" | "disabled"): EnterpriseStatusKind {
  switch (tone) {
    case "healthy":
      return "ready";
    case "attention":
      return "needs-attention";
    case "disabled":
      return "blocked";
    case "neutral":
      return "neutral";
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}

export function useConnectionStatusHelpWorkspaceReadiness(): ConnectionStatusHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);

  const reload = useCallback(() => {
    setSnapshot((current) => ({ ...current, loading: true, loadFailed: false, loadForbidden: false }));

    void fetchTenantIntegrationsOperations()
      .then((data) => {
        const tiles = buildIntegrationReadinessSummaryTiles(data);

        setSnapshot({
          loading: false,
          loadFailed: false,
          loadForbidden: false,
          metrics: tiles.map((tile) => ({
            label: tile.label,
            valueLabel: tile.value,
            statusKind: summaryToneToStatusKind(tile.tone),
            href: CONNECTION_STATUS_CANONICAL_PATH,
          })),
          workspaceScopeLabel: CONNECTION_STATUS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
          loadedAtUtc: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        if (isApiRequestError(error) && error.status === 403) {
          setSnapshot({
            loading: false,
            loadFailed: false,
            loadForbidden: true,
            metrics: [],
            workspaceScopeLabel: null,
            loadedAtUtc: null,
          });

          return;
        }

        setSnapshot({
          loading: false,
          loadFailed: true,
          loadForbidden: false,
          metrics: [],
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

export { CONNECTION_STATUS_HELP_READINESS_SECTION_TITLE };
