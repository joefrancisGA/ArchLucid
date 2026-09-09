"use client";

import { cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { modelExecutionProfileLabel } from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY,
  MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY,
} from "@/lib/model-governance-copy";
import { modelGovernanceAgentTypeLabel } from "@/lib/model-governance-labels";
import {
  modelGovernanceProfileMappingDisclosureHrefFromSearch,
  parseModelGovernanceProfileMappingProfileFromSearch,
} from "@/lib/administration/model-governance-profile-mapping-disclosure-url";

import { AllowedEngineSetControls } from "./ModelGovernanceAllowedEngineSetControls";
import { GovernedAliasRegistryTable } from "./ModelGovernanceAliasRegistryTable";
import { ProfileControls, ProfileTradeoffComparison } from "./ModelGovernanceProfileControls";
import { useModelGovernanceSettings } from "./use-model-governance-settings";

export function ModelGovernanceSettingsCard() {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/model-governance";
  const searchParams = useSearchParams();
  const modelGovernanceProfileMappingProfileParam = searchParams.get("modelGovernanceProfileMappingProfile");
  const [openProfileMapping, setOpenProfileMappingState] = useState(
    () => parseModelGovernanceProfileMappingProfileFromSearch(modelGovernanceProfileMappingProfileParam),
  );

  const syncProfileMappingOpenToUrl = useCallback(
    (profile: string | null) => {
      router.replace(
        modelGovernanceProfileMappingDisclosureHrefFromSearch(searchParams.toString(), profile, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpenProfileMapping = useCallback(
    (profile: string, open: boolean) => {
      const nextProfile = open ? profile : null;
      setOpenProfileMappingState(nextProfile ?? "");
      syncProfileMappingOpenToUrl(nextProfile);
    },
    [syncProfileMappingOpenToUrl],
  );

  useEffect(() => {
    setOpenProfileMappingState(parseModelGovernanceProfileMappingProfileFromSearch(modelGovernanceProfileMappingProfileParam));
  }, [modelGovernanceProfileMappingProfileParam]);

  const {
    state,
    saving,
    successMessage,
    mutationError,
    confirmOpen,
    confirmTitle,
    confirmDescription,
    confirmLabel,
    confirmProfile,
    load,
    requestProfile,
    requestClearOverride,
    confirmMutation,
    retryMutation,
    onConfirmOpenChange,
  } = useModelGovernanceSettings();

  return (
    <Card data-testid="model-governance-settings-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Workspace catalog</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "loading" || state.status === "idle" ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading model policy catalog…</p>
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
              successMessage={successMessage}
              mutationError={mutationError}
              onRequestProfile={requestProfile}
              onRequestClearOverride={requestClearOverride}
              onRetryMutation={retryMutation}
            />

            <AllowedEngineSetControls
              registryEntries={state.catalog.registryEntries}
              allowedEngineSet={state.allowedEngineSet ?? null}
              saving={saving}
              onSaved={() => void load()}
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
                <GovernedAliasRegistryTable entries={state.catalog.registryEntries} />
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
                    open={openProfileMapping === mapping.profile}
                    onToggle={(event) => {
                      setOpenProfileMapping(mapping.profile, (event.currentTarget as HTMLDetailsElement).open);
                    }}
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

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        variant="default"
        busy={saving}
        onConfirm={confirmMutation}
        extraContent={
          confirmProfile != null ? (
            <ProfileTradeoffComparison profile={confirmProfile} data-testid="model-execution-profile-confirm-tradeoffs" />
          ) : undefined
        }
      />
    </Card>
  );
}
