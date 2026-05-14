"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { getExecDigestPreferences, saveExecDigestPreferences, tryGetTenantTrialStatus } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { operateCapabilityFromRank } from "@/lib/operate-capability";
import { showError, showSuccess } from "@/lib/toast";
import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

import type { TenantSettingsVisibleLoad } from "./load-tenant-settings-page-data";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

function buildDigestForm(d: ExecDigestPreferencesResponse): ExecDigestPreferencesUpsertRequest {
  return {
    emailEnabled: d.emailEnabled,
    recipientEmails: [...d.recipientEmails],
    ianaTimeZoneId: d.ianaTimeZoneId,
    dayOfWeek: d.dayOfWeek,
    hourOfDay: d.hourOfDay,
  };
}

export function useTenantSettingsPage(loaded: TenantSettingsVisibleLoad): TenantSettingsPageContentModel {
  const { callerAuthorityRank, currentPrincipal } = useOperatorNavAuthority();
  const canEditDigest = operateCapabilityFromRank(callerAuthorityRank);

  const [digestLoadFailure, setDigestLoadFailure] = useState<string | null>(loaded.digestLoadFailure);
  const [trial, setTrial] = useState<TenantTrialStatusPayload | null>(loaded.trial);
  const [digest, setDigest] = useState<ExecDigestPreferencesResponse | null>(loaded.digest);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExecDigestPreferencesUpsertRequest | null>(() =>
    loaded.digest === null ? null : buildDigestForm(loaded.digest),
  );

  const skipInitialClientLoadRef = useRef(true);

  const load = useCallback(async () => {
    setDigestLoadFailure(null);

    const nextTrial = await tryGetTenantTrialStatus();

    setTrial(nextTrial);

    try {
      const d = await getExecDigestPreferences();

      setDigest(d);
      setForm(buildDigestForm(d));
    } catch (e: unknown) {
      setDigestLoadFailure(toApiLoadFailure(e).message);
    }
  }, []);

  useEffect(() => {
    if (skipInitialClientLoadRef.current) {
      skipInitialClientLoadRef.current = false;

      return;
    }

    void load();
  }, [load]);

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
