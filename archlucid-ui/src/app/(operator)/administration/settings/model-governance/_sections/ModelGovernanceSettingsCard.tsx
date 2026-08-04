"use client";

import { cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isModelExecutionProfile,
  modelExecutionProfileLabel,
  type ModelExecutionProfile,
} from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
  modelGovernanceLoadBlockedMessage,
} from "@/lib/model-governance-copy";
import { modelGovernanceAgentTypeLabel } from "@/lib/model-governance-labels";
import type {
  ModelGovernanceCatalogResponse,
  WorkspaceModelExecutionProfileResponse,
} from "@/lib/model-governance-types";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; catalog: ModelGovernanceCatalogResponse; catalogUnavailableNote?: string }
  | { status: "blocked"; note: string };

const profileEndpoint = "/api/proxy/v1/admin/settings/model-execution-profile";
const catalogEndpoint = "/api/proxy/v1/admin/settings/model-governance-catalog";

function emptyModelGovernanceCatalog(
  profile: WorkspaceModelExecutionProfileResponse,
): ModelGovernanceCatalogResponse {
  return {
    workspaceProfile: profile,
    registryEntries: [],
    profileMappings: [],
  };
}

function parseProfileResponse(body: unknown): WorkspaceModelExecutionProfileResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as WorkspaceModelExecutionProfileResponse;
  const effectiveProfile = record.effectiveProfile;
  const source = record.source;
  const workspaceDefaultProfile = record.workspaceDefaultProfile;

  if (!isModelExecutionProfile(effectiveProfile) || !isModelExecutionProfile(workspaceDefaultProfile)) {
    return null;
  }

  if (typeof source !== "string" || source.trim().length === 0) {
    return null;
  }

  return record;
}

function parseCatalogResponse(body: unknown): ModelGovernanceCatalogResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as ModelGovernanceCatalogResponse;

  if (!Array.isArray(record.registryEntries) || !Array.isArray(record.profileMappings)) {
    return null;
  }

  if (parseProfileResponse(record.workspaceProfile) == null) {
    return null;
  }

  return record;
}

type ProfileControlsProps = {
  profile: WorkspaceModelExecutionProfileResponse;
  saving: boolean;
  onSelectProfile: (profile: ModelExecutionProfile) => void;
  onClearOverride: () => void;
};

function ProfileControls(props: ProfileControlsProps) {
  const { profile, saving, onSelectProfile, onClearOverride } = props;
  const usingOverride = profile.source === "TenantOverride";

  return (
    <div
      className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid="model-execution-profile-controls"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Effective profile:{" "}
        <span data-effective-profile={profile.effectiveProfile}>
          {modelExecutionProfileLabel(profile.effectiveProfile)}
        </span>
        {usingOverride ? (
          <span className="text-al-text-secondary"> (tenant override)</span>
        ) : (
          <span className="text-al-text-secondary">
            {" "}
            (workspace default:{" "}
            <span data-workspace-default-profile={profile.workspaceDefaultProfile}>
              {modelExecutionProfileLabel(profile.workspaceDefaultProfile)}
            </span>
            )
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {(["Economy", "Balanced", "HighAssurance"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={profile.effectiveProfile === option ? "default" : "outline"}
            disabled={saving || profile.effectiveProfile === option}
            onClick={() => void onSelectProfile(option)}
          >
            {modelExecutionProfileLabel(option)}
          </Button>
        ))}
        {usingOverride ? (
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void onClearOverride()}>
            Use workspace default
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ModelGovernanceSettingsCard() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const fetchOpts = mergeRegistrationScopeForProxy({
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const [profileRes, catalogRes] = await Promise.all([
        fetch(profileEndpoint, fetchOpts),
        fetch(catalogEndpoint, fetchOpts),
      ]);

      if (!profileRes.ok) {
        setState({
          status: "blocked",
          note: modelGovernanceLoadBlockedMessage(profileRes.status),
        });

        return;
      }

      const profileBody = parseProfileResponse(await profileRes.json());

      if (profileBody == null) {
        setState({ status: "blocked", note: MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY });

        return;
      }

      let catalogBody: ModelGovernanceCatalogResponse | null = null;
      let catalogUnavailableNote: string | undefined;

      if (!catalogRes.ok) {
        catalogUnavailableNote = MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY;
      } else {
        catalogBody = parseCatalogResponse(await catalogRes.json());

        if (catalogBody == null) {
          catalogUnavailableNote = MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY;
        }
      }

      setState({
        status: "ready",
        catalog: catalogBody
          ? {
              ...catalogBody,
              workspaceProfile: profileBody,
            }
          : emptyModelGovernanceCatalog(profileBody),
        catalogUnavailableNote,
      });
    } catch {
      setState({ status: "blocked", note: MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyProfile = useCallback(
    async (profile: ModelExecutionProfile) => {
      setSaving(true);

      try {
        const res = await fetch(profileEndpoint, {
          ...mergeRegistrationScopeForProxy({
            method: "PUT",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
          }),
          body: JSON.stringify({ profile }),
        });

        if (!res.ok) {
          setState({
            status: "blocked",
            note: MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
          });

          return;
        }

        await load();
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const clearOverride = useCallback(async () => {
    setSaving(true);

    try {
      const res = await fetch(profileEndpoint, {
        ...mergeRegistrationScopeForProxy({
          method: "DELETE",
          headers: { Accept: "application/json" },
        }),
      });

      if (!res.ok) {
        setState({
          status: "blocked",
          note: MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
        });

        return;
      }

      await load();
    } finally {
      setSaving(false);
    }
  }, [load]);

  return (
    <Card data-testid="model-governance-settings-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace catalog</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "loading" || state.status === "idle" ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading model governance catalog…</p>
        ) : null}

        {state.status === "blocked" ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {state.note}
          </p>
        ) : null}

        {state.status === "ready" ? (
          <Fragment>
            <ProfileControls
              profile={state.catalog.workspaceProfile}
              saving={saving}
              onSelectProfile={applyProfile}
              onClearOverride={clearOverride}
            />

            {state.catalogUnavailableNote ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="model-governance-catalog-unavailable"
              >
                {state.catalogUnavailableNote}
              </p>
            ) : null}

            <div className="space-y-2" data-testid="model-governance-registry">
              <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Governed model aliases
              </h3>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Read-only registry entries. Deployment names are never shown here.
              </p>
              {state.catalog.registryEntries.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="model-governance-registry-empty"
                >
                  {MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
                    <thead>
                      <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                        <th className="px-2 py-2">Alias</th>
                        <th className="px-2 py-2">Connection</th>
                        <th className="px-2 py-2">Capabilities</th>
                        <th className="px-2 py-2">Approved tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.catalog.registryEntries.map((entry) => (
                        <tr key={entry.aliasId} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className="px-2 py-2 font-mono">{entry.aliasId}</td>
                          <td className="px-2 py-2">{entry.providerConnectionKind}</td>
                          <td className="px-2 py-2">{entry.capabilityTags.join(", ") || "—"}</td>
                          <td className="px-2 py-2">{entry.approvedTaskTypes.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2" data-testid="model-governance-profile-mappings">
              <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Profile → alias mappings
              </h3>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Resolved alias per agent role for each execution profile tier.
              </p>
              {state.catalog.profileMappings.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="model-governance-profile-mappings-empty"
                >
                  {MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY}
                </p>
              ) : (
                state.catalog.profileMappings.map((mapping) => (
                  <details
                    key={mapping.profile}
                    className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                  >
                    <summary className="cursor-pointer font-medium text-al-text-primary">
                      {modelExecutionProfileLabel(mapping.profile)}
                    </summary>
                    <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
                      {mapping.agentAliasMappings.map((row) => (
                        <li key={`${mapping.profile}-${row.agentType}`} data-agent-type={row.agentType}>
                          {modelGovernanceAgentTypeLabel(row.agentType)}:{" "}
                          <span className="font-mono">{row.aliasId}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))
              )}
            </div>
          </Fragment>
        ) : null}
      </CardContent>
    </Card>
  );
}
