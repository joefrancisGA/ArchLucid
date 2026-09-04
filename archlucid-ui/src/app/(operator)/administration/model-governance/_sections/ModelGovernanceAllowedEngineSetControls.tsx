"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY,
  MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_TITLE_COPY,
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
} from "@/lib/model-governance-copy";
import type {
  ModelAliasRegistryEntryResponse,
  WorkspaceAllowedEngineSetResponse,
} from "@/lib/model-governance-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { allowedEngineSetEndpoint } from "./use-model-governance-settings";
import {
  modelGovernanceEngineResetConfirmHrefFromSearch,
  parseModelGovernanceEngineResetConfirmOpenFromSearch,
} from "@/lib/administration/model-governance-engine-reset-confirm-url";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";

export function AllowedEngineSetControls(props: {
  registryEntries: ModelAliasRegistryEntryResponse[];
  allowedEngineSet: WorkspaceAllowedEngineSetResponse | null;
  saving: boolean;
  onSaved: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const urlResetConfirm = parseModelGovernanceEngineResetConfirmOpenFromSearch(searchParams.get("engineResetConfirm"));
  const { registryEntries, allowedEngineSet, saving, onSaved } = props;
  const [allowedIds, setAllowedIds] = useState<string[]>(allowedEngineSet?.allowedAliasIds ?? []);
  const [defaultAliasId, setDefaultAliasId] = useState(allowedEngineSet?.defaultAliasId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpenState] = useState(urlResetConfirm);

  const syncResetConfirmToUrl = useCallback(
    (confirmOpen: boolean) => {
      router.replace(
        modelGovernanceEngineResetConfirmHrefFromSearch(searchParams.toString(), confirmOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setResetConfirmOpen = useCallback(
    (confirmOpen: boolean) => {
      setResetConfirmOpenState(confirmOpen);
      syncResetConfirmToUrl(confirmOpen);
    },
    [syncResetConfirmToUrl],
  );

  useEffect(() => {
    setResetConfirmOpenState(parseModelGovernanceEngineResetConfirmOpenFromSearch(searchParams.get("engineResetConfirm")));
  }, [searchParams]);

  useEffect(() => {
    setAllowedIds(allowedEngineSet?.allowedAliasIds ?? []);
    setDefaultAliasId(allowedEngineSet?.defaultAliasId ?? "");
  }, [allowedEngineSet]);

  const toggleAllowed = (aliasId: string) => {
    setAllowedIds((current) => {
      if (current.includes(aliasId)) {
        const next = current.filter((id) => id !== aliasId);

        if (defaultAliasId === aliasId && next.length > 0) {
          setDefaultAliasId(next[0] ?? "");
        }

        return next;
      }

      return [...current, aliasId];
    });
  };

  const save = async () => {
    setError(null);

    if (allowedIds.length === 0 || defaultAliasId.trim().length === 0) {
      setError("Select at least one allowed engine and a default.");

      return;
    }

    try {
      const res = await fetch(allowedEngineSetEndpoint, {
        ...mergeRegistrationScopeForProxy({
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        }),
        body: JSON.stringify({ allowedAliasIds: allowedIds, defaultAliasId }),
      });

      if (!res.ok) {
        setError(MODEL_GOVERNANCE_UPDATE_FAILED_COPY);

        return;
      }

      onSaved();
    } catch {
      setError(MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY);
    }
  };

  const clearOverride = async () => {
    setError(null);
    setResetConfirmOpen(false);

    try {
      const res = await fetch(allowedEngineSetEndpoint, {
        ...mergeRegistrationScopeForProxy({
          method: "DELETE",
          headers: { Accept: "application/json" },
        }),
      });

      if (!res.ok) {
        setError(MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY);

        return;
      }

      onSaved();
    } catch {
      setError(MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY);
    }
  };

  if (registryEntries.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid="model-governance-allowed-engine-set"
    >
      <div className="space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Allowed engines for review selection
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace members can pick among these aliases when starting a review. Source:{" "}
          {allowedEngineSet?.source ?? "CatalogDefault"}.
        </p>
      </div>
      <div className="space-y-2">
        {registryEntries.map((entry) => (
          <label key={entry.aliasId} className="flex items-center gap-2 text-sm text-al-text-primary">
            <input
              type="checkbox"
              checked={allowedIds.includes(entry.aliasId)}
              disabled={saving}
              onChange={() => toggleAllowed(entry.aliasId)}
            />
            <span className="font-mono">{entry.aliasId}</span>
          </label>
        ))}
      </div>
      <div className="space-y-1">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Default engine</p>
        <select
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={defaultAliasId}
          disabled={saving || allowedIds.length === 0}
          onChange={(event) => setDefaultAliasId(event.target.value)}
          data-testid="model-governance-default-engine-select"
        >
          {allowedIds.map((aliasId) => (
            <option key={aliasId} value={aliasId}>
              {aliasId}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          Save allowed set
        </Button>
        {allowedEngineSet?.source === "TenantOverride" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => setResetConfirmOpen(true)}
            data-testid="model-governance-allowed-set-reset"
          >
            {MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmationDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_TITLE_COPY}
        description={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_DESCRIPTION_COPY}
        confirmLabel={MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY}
        busy={saving}
        onConfirm={() => void clearOverride()}
      />
    </div>
  );
}
