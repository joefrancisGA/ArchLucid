import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

import type { TenantTrialStatusPayload } from "./tenant-settings-types";

export type TenantSettingsPageContentModel = {
  readonly currentPrincipalName: string | null;
  readonly canEditDigest: boolean;
  readonly digestLoadFailure: string | null;
  readonly trial: TenantTrialStatusPayload | null;
  readonly digest: ExecDigestPreferencesResponse | null;
  readonly saving: boolean;
  readonly form: ExecDigestPreferencesUpsertRequest | null;
  readonly setForm: Dispatch<SetStateAction<ExecDigestPreferencesUpsertRequest | null>>;
  readonly onSaveDigest: (e: FormEvent) => Promise<void>;
};

export type TenantSettingsPageViewModel = TenantSettingsPageContentModel & {
  readonly shouldRenderPage: boolean;
};
