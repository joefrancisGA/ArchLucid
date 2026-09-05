"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { useTenantBrandingAdminQuery } from "@/hooks/use-tenant-branding-admin-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  activateTenantBrandingDraft,
  revertTenantBrandingToDefaults,
  saveTenantBrandingDraft,
  uploadBrandAsset,
} from "@/lib/tenant-branding-admin-client";
import {
  resolveDraftColorOrDefault,
  seedBrandingFormColors,
  validateTenantBrandingAdminFields,
} from "@/lib/tenant-branding-admin-validation";
import type {
  TenantBrandingAdminState,
  TenantBrandingDraftPutRequest,
} from "@/types/tenant-branding-admin";

type BrandingFormFields = {
  readonly companyDisplayName: string;
  readonly companyLegalName: string;
  readonly shortDisplayName: string;
  readonly tagline: string;
  readonly websiteUrl: string;
  readonly supportUrl: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly foregroundColor: string;
  readonly coBrandingEnabled: boolean;
  readonly logoPrimaryAssetId: string | null;
  readonly logoDarkAssetId: string | null;
  readonly logoLightAssetId: string | null;
};

function applyStateToForm(
  state: TenantBrandingAdminState,
  setters: {
    readonly setFields: (value: BrandingFormFields) => void;
    readonly setServerIssues: (value: TenantBrandingAdminState["validationIssues"]) => void;
    readonly setCanActivate: (value: boolean) => void;
  },
): void {
  const defaults = seedBrandingFormColors();

  setters.setFields({
    companyDisplayName: state.draft.companyDisplayName ?? "",
    companyLegalName: state.draft.companyLegalName ?? "",
    shortDisplayName: state.draft.shortDisplayName ?? "",
    tagline: state.draft.tagline ?? "",
    websiteUrl: state.draft.websiteUrl ?? "",
    supportUrl: state.draft.supportUrl ?? "",
    primaryColor: resolveDraftColorOrDefault(state.draft.primaryColor ?? "", defaults.primary),
    secondaryColor: resolveDraftColorOrDefault(state.draft.secondaryColor ?? "", defaults.secondary),
    accentColor: resolveDraftColorOrDefault(state.draft.accentColor ?? "", defaults.accent),
    backgroundColor: resolveDraftColorOrDefault(state.draft.backgroundColor ?? "", defaults.background),
    foregroundColor: resolveDraftColorOrDefault(state.draft.foregroundColor ?? "", defaults.foreground),
    coBrandingEnabled: state.draft.coBrandingEnabled ?? false,
    logoPrimaryAssetId: state.draft.logoPrimaryAssetId ?? null,
    logoDarkAssetId: state.draft.logoDarkAssetId ?? null,
    logoLightAssetId: state.draft.logoLightAssetId ?? null,
  });
  setters.setServerIssues(state.validationIssues);
  setters.setCanActivate(state.canActivate);
}

function toPutRequest(fields: BrandingFormFields): TenantBrandingDraftPutRequest {
  return {
    companyDisplayName: fields.companyDisplayName,
    companyLegalName: fields.companyLegalName,
    shortDisplayName: fields.shortDisplayName,
    tagline: fields.tagline,
    websiteUrl: fields.websiteUrl,
    supportUrl: fields.supportUrl,
    primaryColor: fields.primaryColor,
    secondaryColor: fields.secondaryColor,
    accentColor: fields.accentColor,
    backgroundColor: fields.backgroundColor,
    foregroundColor: fields.foregroundColor,
    coBrandingEnabled: fields.coBrandingEnabled,
    logoPrimaryAssetId: fields.logoPrimaryAssetId,
    logoDarkAssetId: fields.logoDarkAssetId,
    logoLightAssetId: fields.logoLightAssetId,
  };
}

export type UseTenantBrandingAdminSettingsOptions = {
  readonly canEdit: boolean;
};

export function useTenantBrandingAdminSettings({ canEdit }: UseTenantBrandingAdminSettingsOptions) {
  const demoMode = isNextPublicDemoMode();
  const queryClient = useQueryClient();
  const adminQuery = useTenantBrandingAdminQuery({ enabled: !demoMode });

  const [fields, setFields] = useState<BrandingFormFields>(() => {
    const defaults = seedBrandingFormColors();

    return {
      companyDisplayName: "",
      companyLegalName: "",
      shortDisplayName: "",
      tagline: "",
      websiteUrl: "",
      supportUrl: "",
      primaryColor: defaults.primary,
      secondaryColor: defaults.secondary,
      accentColor: defaults.accent,
      backgroundColor: defaults.background,
      foregroundColor: defaults.foreground,
      coBrandingEnabled: false,
      logoPrimaryAssetId: null,
      logoDarkAssetId: null,
      logoLightAssetId: null,
    };
  });
  const [serverIssues, setServerIssues] = useState<TenantBrandingAdminState["validationIssues"]>([]);
  const [canActivateFromServer, setCanActivateFromServer] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (adminQuery.data === undefined) {
      return;
    }

    applyStateToForm(adminQuery.data, {
      setFields,
      setServerIssues: setServerIssues,
      setCanActivate: setCanActivateFromServer,
    });
  }, [adminQuery.data]);

  const fieldValidation = useMemo(
    () =>
      validateTenantBrandingAdminFields({
        companyDisplayName: fields.companyDisplayName,
        primaryColor: fields.primaryColor,
        backgroundColor: fields.backgroundColor,
        foregroundColor: fields.foregroundColor,
        logoPrimaryAssetId: fields.logoPrimaryAssetId,
        serverIssues,
      }),
    [fields, serverIssues],
  );

  const applyServerState = useCallback(
    async (state: TenantBrandingAdminState) => {
      applyStateToForm(state, {
        setFields,
        setServerIssues: setServerIssues,
        setCanActivate: setCanActivateFromServer,
      });
      await queryClient.setQueryData(operatorQueryKeys.tenantBrandingAdmin, state);
      await queryClient.invalidateQueries({ queryKey: ["operator", "tenant", "branding-presentation"] });
    },
    [queryClient],
  );

  const saveMutation = useMutation({
    mutationFn: saveTenantBrandingDraft,
    onSuccess: async (saved) => {
      await applyServerState(saved);
      setSaveConfirmation("Branding draft saved.");
      setSaveError(null);
    },
    onError: (error: unknown) => {
      setSaveError(toApiLoadFailure(error).message);
      setSaveConfirmation(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateTenantBrandingDraft,
    onSuccess: async (result) => {
      if (!result.succeeded || result.state == null) {
        setServerIssues(result.validationIssues);
        setActionError("Activation failed. Resolve the listed validation issues.");
        return;
      }

      await applyServerState(result.state);
      setSaveConfirmation("Branding activated.");
      setActionError(null);
    },
    onError: (error: unknown) => {
      setActionError(toApiLoadFailure(error).message);
    },
  });

  const revertMutation = useMutation({
    mutationFn: revertTenantBrandingToDefaults,
    onSuccess: async (state) => {
      await applyServerState(state);
      setSaveConfirmation("Reverted to ArchLucid defaults.");
      setActionError(null);
    },
    onError: (error: unknown) => {
      setActionError(toApiLoadFailure(error).message);
    },
  });

  const onSaveDraft = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!canEdit || demoMode) {
        return;
      }

      setSaveError(null);
      setActionError(null);
      await saveMutation.mutateAsync(toPutRequest(fields));
    },
    [canEdit, demoMode, fields, saveMutation],
  );

  const onActivate = useCallback(async () => {
    if (!canEdit || demoMode || !fieldValidation.valid) {
      return;
    }

    setActionError(null);
    await activateMutation.mutateAsync();
  }, [activateMutation, canEdit, demoMode, fieldValidation.valid]);

  const onRevert = useCallback(async () => {
    if (!canEdit || demoMode) {
      return;
    }

    setActionError(null);
    await revertMutation.mutateAsync();
  }, [canEdit, demoMode, revertMutation]);

  const onUploadPrimaryLogo = useCallback(
    async (file: File) => {
      if (!canEdit || demoMode) {
        return;
      }

      setUploadingLogo(true);
      setSaveError(null);

      try {
        const uploaded = await uploadBrandAsset(file, "LogoPrimary");
        setFields((current) => ({ ...current, logoPrimaryAssetId: uploaded.assetId }));
      } catch (error: unknown) {
        setSaveError(toApiLoadFailure(error).message);
      } finally {
        setUploadingLogo(false);
      }
    },
    [canEdit, demoMode],
  );

  const mutating = saveMutation.isPending || activateMutation.isPending || revertMutation.isPending;

  return {
    demoMode,
    loading: adminQuery.isLoading,
    loadFailure: adminQuery.error == null ? null : toApiLoadFailure(adminQuery.error),
    fields,
    setFields,
    serverIssues,
    fieldValidation,
    canActivateFromServer,
    canActivate: fieldValidation.valid,
    saveConfirmation,
    saveError,
    actionError,
    uploadingLogo,
    mutating,
    onSaveDraft,
    onActivate,
    onRevert,
    onUploadPrimaryLogo,
    activeSummary: adminQuery.data?.active ?? { isActive: false },
  };
}

export type TenantBrandingAdminSettingsState = ReturnType<typeof useTenantBrandingAdminSettings>;
