"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  activateTenantSamlIdentityProvider,
  discoverIdentityProviderMetadata,
  fetchTenantIdentityProviderConfiguration,
} from "@/lib/admin-identity-provider-api";
import {
  buildSamlSpActivateRequest,
  createDefaultSamlSpConfigurationFormValues,
  hydrateSamlSpConfigurationFormValues,
  isSamlSpConfigurationFormValid,
  resolveSamlSpConfigurationFieldErrors,
  resolveSamlSpConfigurationValidationErrors,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";
import {
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SAML_METADATA_FETCHED_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  resolveSamlSpFetchMetadataDisabledReason,
  resolveSamlSpSaveDisabledReason,
} from "@/lib/saml-sp-configuration-disabled-cta";
import { IDENTITY_PROVIDERS_SAML_CANONICAL_PATH } from "@/lib/identity-providers-saml-evidence-copy";
import {
  parseSamlSaveConfirmOpenFromSearch,
  samlSaveConfirmHrefFromSearch,
} from "@/lib/administration/saml-save-confirm-url";

function serializeSamlSpConfigurationValues(values: SamlSpConfigurationFormValues): string {
  return JSON.stringify({
    issuerUri: values.issuerUri.trim(),
    roleClaimName: values.roleClaimName.trim(),
    customGroupClaimRegex: values.customGroupClaimRegex.trim(),
    mappings: values.mappings.map((row) => ({
      idpValue: row.idpValue.trim(),
      archLucidRole: row.archLucidRole.trim(),
    })),
  });
}

type SamlSpConfigurationTouchedFields = {
  readonly issuerUri: boolean;
  readonly roleClaimName: boolean;
  readonly mappings: boolean;
};

function hasUnsavedConfigurationEdits(
  savedSnapshot: string | null,
  values: SamlSpConfigurationFormValues,
  touched: SamlSpConfigurationTouchedFields,
): boolean {
  // A null snapshot means the saved configuration could not be read, so edits cannot be diffed against
  // it. Fall back to touch state so the test-mapping card still warns that it evaluates saved values.
  if (savedSnapshot === null) {
    return touched.issuerUri || touched.roleClaimName || touched.mappings;
  }

  return serializeSamlSpConfigurationValues(values) !== savedSnapshot;
}

export type UseSamlSpConfigurationFormOptions = {
  readonly onDirtyChange?: (dirty: boolean) => void;
};

export function useSamlSpConfigurationForm(options: UseSamlSpConfigurationFormOptions = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? IDENTITY_PROVIDERS_SAML_CANONICAL_PATH;
  const searchParams = useSearchParams();
  const urlSaveConfirm = parseSamlSaveConfirmOpenFromSearch(searchParams.get("samlSaveConfirm"));
  const [values, setValues] = useState<SamlSpConfigurationFormValues>(() => createDefaultSamlSpConfigurationFormValues());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUtc, setSavedUtc] = useState<string | null>(null);
  const [discoveredClaimNames, setDiscoveredClaimNames] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpenState] = useState(urlSaveConfirm);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState({
    issuerUri: false,
    roleClaimName: false,
    mappings: false,
  });

  const validationErrors = useMemo(() => resolveSamlSpConfigurationValidationErrors(values), [values]);
  const fieldErrors = useMemo(() => resolveSamlSpConfigurationFieldErrors(values), [values]);
  const hasUnsavedEdits = hasUnsavedConfigurationEdits(savedSnapshot, values, touchedFields);

  const syncSaveConfirmToUrl = useCallback(
    (confirmOpen: boolean) => {
      router.replace(samlSaveConfirmHrefFromSearch(searchParams.toString(), confirmOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSaveConfirmOpen = useCallback(
    (confirmOpen: boolean) => {
      setSaveConfirmOpenState(confirmOpen);
      syncSaveConfirmToUrl(confirmOpen);
    },
    [syncSaveConfirmToUrl],
  );

  useEffect(() => {
    setSaveConfirmOpenState(parseSamlSaveConfirmOpenFromSearch(searchParams.get("samlSaveConfirm")));
  }, [searchParams]);

  const loadConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const record = await fetchTenantIdentityProviderConfiguration();

      const hydratedValues = hydrateSamlSpConfigurationFormValues(record);
      setValues(hydratedValues);
      setSavedSnapshot(serializeSamlSpConfigurationValues(hydratedValues));
      setTouchedFields({ issuerUri: false, roleClaimName: false, mappings: false });
      setSavedUtc(record?.updatedUtc ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  useEffect(() => {
    options.onDirtyChange?.(hasUnsavedEdits);
  }, [hasUnsavedEdits, options]);

  const runDiscover = useCallback(async () => {
    if (values.idpMetadataUrl.trim().length === 0) {
      setError("Enter an IdP metadata URL before fetching.");

      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await discoverIdentityProviderMetadata("saml", values.idpMetadataUrl.trim());

      if (response.discoverySucceeded !== true) {
        setError(response.diagnosticSummary ?? "Metadata discovery did not succeed.");

        return;
      }

      setValues((prev) => ({
        ...prev,
        issuerUri: response.issuerUri?.trim() ?? prev.issuerUri,
      }));
      setDiscoveredClaimNames(response.availableClaimNames ?? []);

      setSuccessMessage(SAML_METADATA_FETCHED_SUCCESS_MESSAGE);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values.idpMetadataUrl]);

  const persistConfiguration = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await activateTenantSamlIdentityProvider(buildSamlSpActivateRequest(values));

      setSavedUtc(response.updatedUtc ?? new Date().toISOString());
      setSavedSnapshot(serializeSamlSpConfigurationValues(values));
      setTouchedFields({ issuerUri: false, roleClaimName: false, mappings: false });
      setSuccessMessage(SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE);
      setSaveConfirmOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [values]);

  const requestSaveConfiguration = useCallback(() => {
    if (!isSamlSpConfigurationFormValid(values)) {
      setTouchedFields({ issuerUri: true, roleClaimName: true, mappings: true });

      return;
    }

    setSaveConfirmOpen(true);
  }, [values]);

  const canSave = isSamlSpConfigurationFormValid(values) && !busy && !loading;
  const saveDisabledReason = resolveSamlSpSaveDisabledReason({ values, loading, busy });
  const fetchMetadataDisabledReason = resolveSamlSpFetchMetadataDisabledReason({
    metadataUrl: values.idpMetadataUrl,
    busy,
  });

  return {
    values,
    setValues,
    loading,
    busy,
    error,
    savedUtc,
    discoveredClaimNames,
    successMessage,
    saveConfirmOpen,
    setSaveConfirmOpen,
    touchedFields,
    setTouchedFields,
    validationErrors,
    fieldErrors,
    hasUnsavedEdits,
    runDiscover,
    persistConfiguration,
    requestSaveConfiguration,
    canSave,
    saveDisabledReason,
    fetchMetadataDisabledReason,
  };
}
