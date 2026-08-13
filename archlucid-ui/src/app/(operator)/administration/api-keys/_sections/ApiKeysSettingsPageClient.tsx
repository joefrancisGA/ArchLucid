"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { buildApiKeysSummary } from "@/lib/build-api-keys-summary";
import {
  API_KEYS_ACTION_ISSUE_OVERLAP,
  API_KEYS_ACTION_ROTATE_ADMIN,
  API_KEYS_ACTION_ROTATE_READONLY,
  API_KEYS_ACTION_VIEW_AUDIT,
  API_KEYS_ADMIN_KEY_NAME,
  API_KEYS_CREDENTIALS_SECTION_TITLE,
  API_KEYS_ENTERPRISE_ONLY_NOTICE,
  API_KEYS_OVERLAP_SUCCESS,
  API_KEYS_PAGE_SUBTITLE,
  API_KEYS_PAGE_TITLE,
  API_KEYS_PERMISSION_ADMIN,
  API_KEYS_PERMISSION_READONLY,
  API_KEYS_READONLY_KEY_NAME,
  API_KEYS_RECENT_EVENTS_SECTION_TITLE,
  API_KEYS_RESTRICTED_DESCRIPTION,
  API_KEYS_ROTATE_FAILED,
  API_KEYS_ROTATE_SUCCESS_ADMIN,
  API_KEYS_ROTATE_SUCCESS_READONLY,
  API_KEYS_SSO_ONLY_NOTICE,
  API_KEYS_STATUS_ACTIVE,
  API_KEYS_STATUS_EXPIRED,
  API_KEYS_STATUS_NOT_CONFIGURED,
  API_KEYS_AUDIT_ACTOR_SELF,
} from "@/lib/api-keys-settings-copy";
import type {
  ApiKeyAuditEvent,
  ApiKeyCredentialSlot,
  ApiKeyPendingAction,
} from "@/lib/api-keys-settings-types";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeysUsersVocabularyRail } from "@/components/ApiKeysUsersVocabularyRail";
import { DeveloperApiContractsApiKeysVocabularyRail } from "@/components/DeveloperApiContractsApiKeysVocabularyRail";
import { WebhooksApiKeysVocabularyRail } from "@/components/WebhooksApiKeysVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ApiKeyActionConfirmDialog } from "./ApiKeyActionConfirmDialog";
import { ApiKeyCredentialTable, type ApiKeyCredentialRowModel } from "./ApiKeyCredentialTable";
import { ApiKeyRecentEventsTable } from "./ApiKeyRecentEventsTable";
import { ApiKeyRotateRevealPanel } from "./ApiKeyRotateRevealPanel";
import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";
import { ApiKeysSettingsSummaryRow } from "./ApiKeysSettingsSummaryRow";
import { ApiKeysSettingsTechnicalDetails } from "./ApiKeysSettingsTechnicalDetails";

type AdminApiKeySettingsResponse = components["schemas"]["AdminApiKeySettingsResponse"];
type AdminApiKeyRotateResponse = components["schemas"]["AdminApiKeyRotateResponse"];
type ApiKeySlotStatusDto = components["schemas"]["ApiKeySlotStatusDto"];

const settingsPath = "/api/proxy/v1/admin/settings/api-keys";

type LoadState =
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

export function ApiKeysSettingsPageClient() {
  const showTechnicalDetails = isArchLucidInternalOperatorShellEnv();
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [rotateReveal, setRotateReveal] = useState<AdminApiKeyRotateResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<ApiKeyPendingAction | null>(null);
  const [rotating, setRotating] = useState(false);
  const [auditEvents, setAuditEvents] = useState<readonly ApiKeyAuditEvent[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
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

  if (state.status === "blocked") {
    return <ApiKeysSettingsRestrictedState reason="forbidden" />;
  }

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="api-keys-settings-page">
      <OperatorPageHeader
        navHref={SETTINGS_ROOT_PATH}
        title={API_KEYS_PAGE_TITLE}
        headingLevel="h1"
        subtitle={
          <>
            <p className="m-0">{API_KEYS_PAGE_SUBTITLE}</p>
            <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{API_KEYS_ENTERPRISE_ONLY_NOTICE}</p>
          </>
        }
        subtitleClassName="max-w-prose"
        actions={<PageContextualHelpButton />}
      >
        <ApiKeysUsersVocabularyRail currentSurfaceId="api-keys" />
        <WebhooksApiKeysVocabularyRail currentSurfaceId="api-keys" />
        <DeveloperApiContractsApiKeysVocabularyRail currentSurfaceId="api-keys" />
      </OperatorPageHeader>
{state.status === "loading" ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading API key status…</p>
      ) : null}

      {state.status === "ready" && state.settings.enabled === false ? (
        <p className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)} role="status">
          {API_KEYS_SSO_ONLY_NOTICE}
        </p>
      ) : null}

      {statusBanner ? (
        <p className={cn("m-0", DESIGN_TOKENS.callout.success, OPERATOR_TYPOGRAPHY.body)} role="status">
          {statusBanner}
        </p>
      ) : null}

      <ApiKeysSettingsSummaryRow summary={summary} loading={state.status === "loading"} />

      {state.status === "ready" ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{API_KEYS_CREDENTIALS_SECTION_TITLE}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={rotating}
                onClick={() => setPendingAction({ kind: "issue_overlap" })}
              >
                {API_KEYS_ACTION_ISSUE_OVERLAP}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={rotating}
                onClick={() => setPendingAction({ kind: "rotate_readonly" })}
              >
                {API_KEYS_ACTION_ROTATE_READONLY}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {API_KEYS_ACTION_VIEW_AUDIT}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={rotating}
                onClick={() => setPendingAction({ kind: "rotate_admin" })}
              >
                {API_KEYS_ACTION_ROTATE_ADMIN}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ApiKeyCredentialTable
              rows={credentialRows}
              busy={rotating}
              onIssueOverlap={() => setPendingAction({ kind: "issue_overlap" })}
              onRotateAdmin={() => setPendingAction({ kind: "rotate_admin" })}
              onRotateReadOnly={() => setPendingAction({ kind: "rotate_readonly" })}
            />
          </CardContent>
        </Card>
      ) : null}

      <section ref={eventsSectionRef} className="space-y-3">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{API_KEYS_RECENT_EVENTS_SECTION_TITLE}</h2>
        <ApiKeyRecentEventsTable events={auditEvents} />
      </section>

      {rotateReveal ? <ApiKeyRotateRevealPanel response={rotateReveal} onDismiss={() => setRotateReveal(null)} /> : null}

      {showTechnicalDetails && state.status === "ready" ? (
        <ApiKeysSettingsTechnicalDetails settings={state.settings} rotateResponse={rotateReveal} />
      ) : null}

      <ApiKeyActionConfirmDialog
        pendingAction={pendingAction}
        busy={rotating}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
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
        }}
      />
    </OperatorPageContainer>
  );
}
