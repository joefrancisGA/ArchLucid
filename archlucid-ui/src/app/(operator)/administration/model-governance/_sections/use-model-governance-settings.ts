"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  isModelExecutionProfile,
  modelExecutionProfileLabel,
  type ModelExecutionProfile,
} from "@/lib/model-execution-profile";
import {
  MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY,
  MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_LABEL_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_TITLE_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_DESCRIPTION_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY,
  MODEL_GOVERNANCE_PROFILE_CONFIRM_TITLE_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY,
  MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY,
  MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
  modelGovernanceLoadBlockedMessage,
  modelGovernanceProfileSuccessMessage,
} from "@/lib/model-governance-copy";
import type {
  ModelGovernanceCatalogResponse,
  WorkspaceAllowedEngineSetResponse,
  WorkspaceModelExecutionProfileResponse,
} from "@/lib/model-governance-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";
import {
  modelGovernanceProfileActionConfirmHrefFromSearch,
  parseModelGovernanceProfileActionFromSearch,
  parseModelGovernanceProfileIdFromSearch,
  type ModelGovernanceProfileAction,
} from "@/lib/administration/model-governance-profile-action-confirm-url";

export const profileEndpoint = "/api/proxy/v1/admin/settings/model-execution-profile";
export const catalogEndpoint = "/api/proxy/v1/admin/settings/model-governance-catalog";
export const allowedEngineSetEndpoint = "/api/proxy/v1/admin/settings/allowed-engine-set";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      catalog: ModelGovernanceCatalogResponse;
      catalogUnavailableNote?: string;
      allowedEngineSet?: WorkspaceAllowedEngineSetResponse | null;
    }
  | { status: "blocked"; note: string };

type PendingProfileMutation =
  | { kind: "select"; profile: ModelExecutionProfile }
  | { kind: "clear" };

export type UseModelGovernanceSettingsResult = {
  readonly state: LoadState;
  readonly saving: boolean;
  readonly successMessage: string | null;
  readonly mutationError: string | null;
  readonly confirmOpen: boolean;
  readonly confirmTitle: string;
  readonly confirmDescription: string;
  readonly confirmLabel: string;
  readonly confirmProfile: ModelExecutionProfile | null;
  readonly load: () => Promise<void>;
  readonly requestProfile: (profile: ModelExecutionProfile) => void;
  readonly requestClearOverride: () => void;
  readonly confirmMutation: () => void;
  readonly retryMutation: () => void;
  readonly onConfirmOpenChange: (open: boolean) => void;
};

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

function parseAllowedEngineSetResponse(body: unknown): WorkspaceAllowedEngineSetResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as WorkspaceAllowedEngineSetResponse;

  if (!Array.isArray(record.allowedAliasIds) || typeof record.defaultAliasId !== "string") {
    return null;
  }

  return record;
}

export function useModelGovernanceSettings(): UseModelGovernanceSettingsResult {
  const router = useRouter();
  const pathname = usePathname() ?? MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const urlProfileAction = parseModelGovernanceProfileActionFromSearch(searchParams.get("modelProfileAction"));
  const urlProfileId = parseModelGovernanceProfileIdFromSearch(searchParams.get("modelProfileId"));
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<PendingProfileMutation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastFailedMutation, setLastFailedMutation] = useState<PendingProfileMutation | null>(null);

  const syncProfileConfirmToUrl = useCallback(
    (mutation: PendingProfileMutation | null) => {
      const action: ModelGovernanceProfileAction | null =
        mutation === null ? null : mutation.kind === "clear" ? "clear" : "select";
      const profileId = mutation?.kind === "select" ? mutation.profile : null;

      router.replace(
        modelGovernanceProfileActionConfirmHrefFromSearch(
          searchParams.toString(),
          { action, profileId },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const fetchOpts = mergeRegistrationScopeForProxy({
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const [profileRes, catalogRes, allowedSetRes] = await Promise.all([
        fetch(profileEndpoint, fetchOpts),
        fetch(catalogEndpoint, fetchOpts),
        fetch(allowedEngineSetEndpoint, fetchOpts),
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

      let allowedEngineSet: WorkspaceAllowedEngineSetResponse | null = null;

      if (allowedSetRes.ok) {
        allowedEngineSet = parseAllowedEngineSetResponse(await allowedSetRes.json());
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
        allowedEngineSet,
      });
    } catch {
      setState({ status: "blocked", note: MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (urlProfileAction === null) {
      if (confirmOpen) {
        setConfirmOpen(false);
        setPendingMutation(null);
      }

      return;
    }

    if (urlProfileAction === "clear") {
      if (pendingMutation?.kind === "clear" && confirmOpen) {
        return;
      }

      setPendingMutation({ kind: "clear" });
      setConfirmOpen(true);

      return;
    }

    if (urlProfileId.length === 0 || !isModelExecutionProfile(urlProfileId)) {
      return;
    }

    if (pendingMutation?.kind === "select" && pendingMutation.profile === urlProfileId && confirmOpen) {
      return;
    }

    setPendingMutation({ kind: "select", profile: urlProfileId });
    setConfirmOpen(true);
  }, [confirmOpen, pendingMutation, urlProfileAction, urlProfileId]);

  const executeMutation = useCallback(
    async (mutation: PendingProfileMutation) => {
      setSaving(true);
      setMutationError(null);
      setSuccessMessage(null);

      try {
        const isClear = mutation.kind === "clear";
        const res = await fetch(profileEndpoint, {
          ...mergeRegistrationScopeForProxy({
            method: isClear ? "DELETE" : "PUT",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
          }),
          ...(isClear
            ? {}
            : {
                body: JSON.stringify({ profile: mutation.profile }),
              }),
        });

        if (!res.ok) {
          setMutationError(
            isClear ? MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY : MODEL_GOVERNANCE_UPDATE_FAILED_COPY,
          );
          setLastFailedMutation(mutation);

          return;
        }

        const parsed = parseProfileResponse(await res.json());

        if (parsed == null) {
          setMutationError(MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY);
          setLastFailedMutation(mutation);

          return;
        }

        setLastFailedMutation(null);
        setSuccessMessage(
          isClear
            ? modelGovernanceProfileSuccessMessage(
                modelExecutionProfileLabel(parsed.workspaceDefaultProfile),
              )
            : modelGovernanceProfileSuccessMessage(modelExecutionProfileLabel(parsed.effectiveProfile)),
        );
        await load();
      } finally {
        setSaving(false);
        setConfirmOpen(false);
        setPendingMutation(null);
        syncProfileConfirmToUrl(null);
      }
    },
    [load, syncProfileConfirmToUrl],
  );

  const requestProfile = useCallback(
    (profile: ModelExecutionProfile) => {
      setPendingMutation({ kind: "select", profile });
      setConfirmOpen(true);
      syncProfileConfirmToUrl({ kind: "select", profile });
    },
    [syncProfileConfirmToUrl],
  );

  const requestClearOverride = useCallback(() => {
    setPendingMutation({ kind: "clear" });
    setConfirmOpen(true);
    syncProfileConfirmToUrl({ kind: "clear" });
  }, [syncProfileConfirmToUrl]);

  const confirmMutation = useCallback(() => {
    if (pendingMutation == null) {
      return;
    }

    void executeMutation(pendingMutation);
  }, [executeMutation, pendingMutation]);

  const retryMutation = useCallback(() => {
    if (lastFailedMutation == null) {
      return;
    }

    void executeMutation(lastFailedMutation);
  }, [executeMutation, lastFailedMutation]);

  const onConfirmOpenChange = useCallback(
    (open: boolean) => {
      setConfirmOpen(open);

      if (!open) {
        setPendingMutation(null);
        syncProfileConfirmToUrl(null);
      }
    },
    [syncProfileConfirmToUrl],
  );

  const confirmTitle =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_TITLE_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_TITLE_COPY;

  const confirmDescription =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_DESCRIPTION_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_DESCRIPTION_COPY;

  const confirmLabel =
    pendingMutation?.kind === "clear"
      ? MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_LABEL_COPY
      : MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY;

  const confirmProfile =
    pendingMutation?.kind === "select" ? pendingMutation.profile : null;

  return {
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
  };
}
