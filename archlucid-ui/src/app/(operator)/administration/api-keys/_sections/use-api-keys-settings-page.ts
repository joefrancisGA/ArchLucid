"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { buildApiKeysSummary } from "@/lib/build-api-keys-summary";
import {
  API_KEYS_ADMIN_KEY_NAME,
  API_KEYS_AUDIT_ACTOR_SELF,
  API_KEYS_OVERLAP_SUCCESS,
  API_KEYS_PERMISSION_ADMIN,
  API_KEYS_PERMISSION_READONLY,
  API_KEYS_READONLY_KEY_NAME,
  API_KEYS_RESTRICTED_DESCRIPTION,
  API_KEYS_ROTATE_FAILED,
  API_KEYS_ROTATE_SUCCESS_ADMIN,
  API_KEYS_ROTATE_SUCCESS_READONLY,
  API_KEYS_STATUS_ACTIVE,
  API_KEYS_STATUS_EXPIRED,
  API_KEYS_STATUS_NOT_CONFIGURED,
} from "@/lib/api-keys-settings-copy";
import type {
  ApiKeyAuditEvent,
  ApiKeyCredentialSlot,
  ApiKeyPendingAction,
} from "@/lib/api-keys-settings-types";
import {
  resolveApiKeysIssueEmphasizedStepId,
  resolveApiKeysIssueSteps,
} from "@/lib/api-keys-issue-checklist";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveContinueLastApiKeyCredential,
  writeApiKeyCredentialLastViewedSlot,
} from "@/lib/resolve-continue-last-api-key-credential";

import type { ApiKeyCredentialRowModel } from "./ApiKeyCredentialTable";

type AdminApiKeySettingsResponse = components["schemas"]["AdminApiKeySettingsResponse"];
type AdminApiKeyRotateResponse = components["schemas"]["AdminApiKeyRotateResponse"];
type ApiKeySlotStatusDto = components["schemas"]["ApiKeySlotStatusDto"];

const settingsPath = "/api/proxy/v1/admin/settings/api-keys";

export type ApiKeysSettingsLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; settings: AdminApiKeySettingsResponse }
  | { status: "blocked"; note: string };

function resolveSlotStatusLabel(slot: ApiKeySlotStatusDto | undefined): string {
  if (slot?.isConfigured !== true) {
    return API_KEYS_STATUS_NOT_CONFIGURED;
  }

  if (slot.expiresAtUtc) {
    const expiresMs = Date.parse(slot.expiresAtUtc);

    if (!Number.isNaN(expiresMs) && expiresMs < Date.now()) {
      return API_KEYS_STATUS_EXPIRED;
    }
  }

  return API_KEYS_STATUS_ACTIVE;
}

function buildCredentialRows(settings: AdminApiKeySettingsResponse): readonly ApiKeyCredentialRowModel[] {
  return [
    {
      slot: "Admin",
      keyName: API_KEYS_ADMIN_KEY_NAME,
      permissionLabel: API_KEYS_PERMISSION_ADMIN,
      slotStatus: settings.admin,
      statusLabel: resolveSlotStatusLabel(settings.admin),
    },
    {
      slot: "ReadOnly",
      keyName: API_KEYS_READONLY_KEY_NAME,
      permissionLabel: API_KEYS_PERMISSION_READONLY,
      slotStatus: settings.readOnly,
      statusLabel: resolveSlotStatusLabel(settings.readOnly),
    },
  ];
}

function createAuditEvent(
  action: ApiKeyAuditEvent["action"],
  keyName: string,
  outcome: ApiKeyAuditEvent["outcome"],
): ApiKeyAuditEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAtUtc: new Date().toISOString(),
    actor: API_KEYS_AUDIT_ACTOR_SELF,
    action,
    keyName,
    outcome,
  };
}

function resolveSuccessBanner(
  slot: ApiKeyCredentialSlot,
  invalidatePrevious: boolean,
): string {
  if (slot === "ReadOnly") {
    return API_KEYS_ROTATE_SUCCESS_READONLY;
  }

  if (!invalidatePrevious) {
    return API_KEYS_OVERLAP_SUCCESS;
  }

  return API_KEYS_ROTATE_SUCCESS_ADMIN;
}

export function useApiKeysSettingsPage() {
  const [state, setState] = useState<ApiKeysSettingsLoadState>({ status: "idle" });
  const [rotateReveal, setRotateReveal] = useState<AdminApiKeyRotateResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<ApiKeyPendingAction | null>(null);
  const [rotating, setRotating] = useState(false);
  const [auditEvents, setAuditEvents] = useState<readonly ApiKeyAuditEvent[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [secretAcknowledged, setSecretAcknowledged] = useState(false);
  const eventsSectionRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch(
        settingsPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setState({
          status: "blocked",
          note:
            res.status === 401 || res.status === 403
              ? API_KEYS_RESTRICTED_DESCRIPTION
              : `API key settings unavailable (HTTP ${res.status}).`,
        });

        return;
      }

      const settings = (await res.json()) as AdminApiKeySettingsResponse;
      setState({ status: "ready", settings });
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const executeRotate = useCallback(
    async (slot: ApiKeyCredentialSlot, invalidatePrevious: boolean) => {
      setRotating(true);
      setRotateReveal(null);
      setStatusBanner(null);
      const keyName = slot === "Admin" ? API_KEYS_ADMIN_KEY_NAME : API_KEYS_READONLY_KEY_NAME;

      try {
        const res = await fetch(`${settingsPath}/rotate`, {
          ...mergeRegistrationScopeForProxy({
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
          }),
          body: JSON.stringify({ slot, invalidatePrevious }),
        });

        if (!res.ok) {
          setAuditEvents((current) => [
            createAuditEvent("rotation_failed", keyName, "failed"),
            ...current,
          ]);
          setStatusBanner(API_KEYS_ROTATE_FAILED);

          return;
        }

        const response = (await res.json()) as AdminApiKeyRotateResponse;
        writeApiKeyCredentialLastViewedSlot(slot);
        setRotateReveal(response);
        setStatusBanner(resolveSuccessBanner(slot, invalidatePrevious));
        setAuditEvents((current) => [
          createAuditEvent(
            slot === "Admin" && !invalidatePrevious ? "overlap_key_issued" : "key_rotated",
            keyName,
            "success",
          ),
          ...current,
        ]);
        await load();
      } catch {
        setAuditEvents((current) => [
          createAuditEvent("rotation_failed", keyName, "failed"),
          ...current,
        ]);
        setStatusBanner(API_KEYS_ROTATE_FAILED);
      } finally {
        setRotating(false);
        setPendingAction(null);
      }
    },
    [load],
  );

  const summary = useMemo(() => {
    if (state.status !== "ready") {
      return {
        accessEnabled: false,
        activeAdminKeys: 0,
        activeReadOnlyKeys: 0,
        lastRotationUtc: null,
        lastUsedUtc: null,
      };
    }

    return buildApiKeysSummary(state.settings, auditEvents);
  }, [auditEvents, state]);

  const credentialRows = useMemo(() => {
    if (state.status !== "ready") {
      return [];
    }

    return buildCredentialRows(state.settings);
  }, [state]);

  const continueLastCredential = useMemo(
    () =>
      resolveContinueLastApiKeyCredential(
        credentialRows.map((row) => ({
          slot: row.slot,
          keyName: row.keyName,
          isConfigured: row.slotStatus?.isConfigured === true,
          expiresAtUtc: row.slotStatus?.expiresAtUtc,
        })),
        auditEvents,
      ),
    [auditEvents, credentialRows],
  );

  function rememberPendingAction(action: ApiKeyPendingAction): void {
    writeApiKeyCredentialLastViewedSlot(action.kind === "rotate_readonly" ? "ReadOnly" : "Admin");
    setSecretAcknowledged(false);
    setPendingAction(action);
  }

  function openCredential(slot: ApiKeyCredentialSlot): void {
    writeApiKeyCredentialLastViewedSlot(slot);
    document
      .querySelector(`[data-api-key-slot="${slot}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const apiKeysIssueSteps = resolveApiKeysIssueSteps({
    slotSelected: pendingAction !== null || rotating || rotateReveal !== null,
    confirmAcknowledged: rotating || rotateReveal !== null,
    secretStored: secretAcknowledged,
  });
  const apiKeysIssueEmphasizedStepId = resolveApiKeysIssueEmphasizedStepId({
    slotSelected: pendingAction !== null || rotating || rotateReveal !== null,
    confirmAcknowledged: rotating || rotateReveal !== null,
    secretStored: secretAcknowledged,
  });

  function confirmPendingAction(): void {
    if (pendingAction === null) {
      return;
    }

    if (pendingAction.kind === "rotate_admin") {
      void executeRotate("Admin", true);
      return;
    }

    if (pendingAction.kind === "rotate_readonly") {
      void executeRotate("ReadOnly", true);
      return;
    }

    void executeRotate("Admin", false);
  }

  function dismissRotateReveal(): void {
    setSecretAcknowledged(true);
    setRotateReveal(null);
  }

  return {
    state,
    rotateReveal,
    pendingAction,
    rotating,
    auditEvents,
    statusBanner,
    eventsSectionRef,
    summary,
    credentialRows,
    continueLastCredential,
    apiKeysIssueSteps,
    apiKeysIssueEmphasizedStepId,
    rememberPendingAction,
    openCredential,
    setPendingAction,
    confirmPendingAction,
    dismissRotateReveal,
  };
}
