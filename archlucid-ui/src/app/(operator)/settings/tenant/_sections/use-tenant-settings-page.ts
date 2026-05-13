"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode, isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operateCapabilityFromRank } from "@/lib/operate-capability";
import { showError, showSuccess } from "@/lib/toast";
import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

import type { TenantSettingsPageViewModel } from "./tenant-settings-page-view-model";
import type { TenantTrialStatusPayload } from "./tenant-settings-types";

export function useTenantSettingsPage(): TenantSettingsPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const shouldRenderPage = !isDemo && !buyerPolishedShell;

  const { callerAuthorityRank, currentPrincipal } = useOperatorNavAuthority();
  const canEditDigest = operateCapabilityFromRank(callerAuthorityRank);
  const [digestLoadFailure, setDigestLoadFailure] = useState<string | null>(null);
  const [trial, setTrial] = useState<TenantTrialStatusPayload | null>(null);
  const [digest, setDigest] = useState<ExecDigestPreferencesResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExecDigestPreferencesUpsertRequest | null>(null);

  const load = useCallback(async () => {
    setDigestLoadFailure(null);

    try {
      const tRes = await fetch(
        "/api/proxy/v1/tenant/trial-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (tRes.ok) {
        setTrial((await tRes.json()) as TenantTrialStatusPayload);
      } else {
        setTrial(null);
      }
    } catch {
      setTrial(null);
    }

    try {
      const d = await getExecDigestPreferences();

      setDigest(d);
      setForm({
        emailEnabled: d.emailEnabled,
        recipientEmails: [...d.recipientEmails],
        ianaTimeZoneId: d.ianaTimeZoneId,
        dayOfWeek: d.dayOfWeek,
        hourOfDay: d.hourOfDay,
      });
    } catch (e) {
      setDigestLoadFailure(toApiLoadFailure(e).message);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
  }, [isDemo, load]);

  const onSaveDigest = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (form === null) {
        return;
      }

      if (!canEditDigest) {
        return;
      }

      setSaving(true);

      try {
        const next = await saveExecDigestPreferences(form);
        setDigest(next);
        showSuccess("Notification preferences saved.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showError("Could not save notification preferences", msg);
      } finally {
        setSaving(false);
      }
    },
    [canEditDigest, form],
  );

  return {
    shouldRenderPage,
    currentPrincipalName: currentPrincipal.name ?? null,
    canEditDigest,
    digestLoadFailure,
    trial,
    digest,
    saving,
    form,
    setForm,
    onSaveDigest,
  };
}
