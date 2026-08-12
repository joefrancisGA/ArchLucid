import type { TenantIdentityProviderConfigurationRecord } from "@/lib/admin-identity-provider-api";
import type { IdentityProviderActivateBody } from "@/lib/admin-identity-provider-api";
import { IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED, IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED } from "@/lib/identity-providers-settings-copy";
import { TENANT_IDENTITY_PROTOCOL } from "@/lib/tenant-identity-protocol";

const ARCHLUCID_ROLES = ["Admin", "Operator", "Reader", "Auditor"] as const;

export type SamlSpClaimMappingRow = {
  readonly rowId: string;
  idpValue: string;
  archLucidRole: string;
};

export type SamlSpConfigurationFormValues = {
  idpMetadataUrl: string;
  issuerUri: string;
  roleClaimName: string;
  mappings: SamlSpClaimMappingRow[];
  customGroupClaimRegex: string;
};

type ClaimMappingJsonDocument = {
  roleClaimName?: string;
  mappings?: { idpValue?: string; archLucidRole?: string }[];
  customGroupClaimRegex?: string | null;
};

let nextSamlMappingRowId = 0;

/** Stable row key for React lists — not persisted to the API. */
export function createSamlSpMappingRowId(): string {
  nextSamlMappingRowId += 1;

  return `saml-mapping-row-${nextSamlMappingRowId}`;
}

export function createDefaultSamlSpClaimMappingRow(archLucidRole: string): SamlSpClaimMappingRow {
  return {
    rowId: createSamlSpMappingRowId(),
    idpValue: "",
    archLucidRole,
  };
}

export function createDefaultSamlSpConfigurationFormValues(): SamlSpConfigurationFormValues {
  return {
    idpMetadataUrl: "",
    issuerUri: "",
    roleClaimName: "groups",
    mappings: ARCHLUCID_ROLES.map((archLucidRole) => createDefaultSamlSpClaimMappingRow(archLucidRole)),
    customGroupClaimRegex: "",
  };
}

export function hydrateSamlSpConfigurationFormValues(
  record: TenantIdentityProviderConfigurationRecord | null,
): SamlSpConfigurationFormValues {
  const defaults = createDefaultSamlSpConfigurationFormValues();

  if (record === null || record.protocol !== TENANT_IDENTITY_PROTOCOL.Saml) {
    return defaults;
  }

  let parsedMapping: ClaimMappingJsonDocument | null = null;

  if (typeof record.claimMappingJson === "string" && record.claimMappingJson.trim().length > 0) {
    try {
      parsedMapping = JSON.parse(record.claimMappingJson) as ClaimMappingJsonDocument;
    } catch {
      parsedMapping = null;
    }
  }

  const savedMappings = (parsedMapping?.mappings ?? [])
    .map((entry) => {
      const archLucidRole = entry.archLucidRole?.trim() ?? "";
      const idpValue = entry.idpValue?.trim() ?? "";

      if (archLucidRole.length === 0 || idpValue.length === 0) {
        return null;
      }

      return {
        ...createDefaultSamlSpClaimMappingRow(archLucidRole),
        idpValue,
      };
    })
    .filter((row): row is SamlSpClaimMappingRow => row !== null);

  const hydratedMappings =
    savedMappings.length > 0
      ? savedMappings
      : defaults.mappings;

  return {
    ...defaults,
    issuerUri: record.issuerUri?.trim() ?? "",
    roleClaimName: parsedMapping?.roleClaimName?.trim() || defaults.roleClaimName,
    customGroupClaimRegex: parsedMapping?.customGroupClaimRegex?.trim() ?? "",
    mappings: hydratedMappings,
  };
}

export function buildSamlSpActivateRequest(values: SamlSpConfigurationFormValues): IdentityProviderActivateBody {
  return {
    protocol: "saml",
    issuerUri: values.issuerUri.trim(),
    metadataXml: null,
    claimMapping: {
      roleClaimName: values.roleClaimName.trim(),
      mappings: values.mappings
        .filter((row) => row.idpValue.trim().length > 0)
        .map((row) => ({
          idpValue: row.idpValue.trim(),
          archLucidRole: row.archLucidRole.trim(),
        })),
      customGroupClaimRegex: values.customGroupClaimRegex.trim() || null,
    },
    keyVaultSecretName: null,
  };
}

export { ARCHLUCID_ROLES as SAML_SP_ARCHLUCID_ROLES };

export function isSamlSpConfigurationFormValid(values: SamlSpConfigurationFormValues): boolean {
  return resolveSamlSpConfigurationValidationError(values) === null;
}

const SAML_SP_ROLE_CLAIM_VALIDATION_REQUIRED = "Attribute used for roles/groups is required.";
const SAML_SP_INCOMPLETE_MAPPING_ROW_VALIDATION =
  "Complete every role mapping row or clear unused values.";

function collectSamlSpConfigurationValidationErrors(values: SamlSpConfigurationFormValues): string[] {
  const errors: string[] = [];

  if (values.issuerUri.trim().length === 0) {
    errors.push(IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED);
  }

  if (values.roleClaimName.trim().length === 0) {
    errors.push(SAML_SP_ROLE_CLAIM_VALIDATION_REQUIRED);
  }

  const populatedMappings = values.mappings.filter((row) => row.idpValue.trim().length > 0);

  if (!populatedMappings.some((row) => row.archLucidRole.trim().length > 0)) {
    errors.push(IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED);
  }

  for (const row of populatedMappings) {
    if (row.archLucidRole.trim().length === 0) {
      errors.push(SAML_SP_INCOMPLETE_MAPPING_ROW_VALIDATION);
      break;
    }
  }

  const idpValues = populatedMappings.map((row) => row.idpValue.trim().toLowerCase());
  const duplicate = idpValues.find((value, index) => idpValues.indexOf(value) !== index);

  if (duplicate !== undefined) {
    errors.push(`Duplicate IdP group or role value: ${duplicate}`);
  }

  return errors;
}

/** Returns every validation error for SAML SP configuration, in display order. */
export function resolveSamlSpConfigurationValidationErrors(values: SamlSpConfigurationFormValues): string[] {
  return collectSamlSpConfigurationValidationErrors(values);
}

/** Returns the first validation error for SAML SP configuration, if any. */
export function resolveSamlSpConfigurationValidationError(values: SamlSpConfigurationFormValues): string | null {
  const errors = collectSamlSpConfigurationValidationErrors(values);

  return errors.length > 0 ? errors[0] : null;
}

export type SamlSpConfigurationFieldErrors = {
  readonly issuerUri: string | null;
  readonly roleClaimName: string | null;
  readonly mappings: string | null;
};

/** Field-scoped validation messages for inline form affordances. */
export function resolveSamlSpConfigurationFieldErrors(
  values: SamlSpConfigurationFormValues,
): SamlSpConfigurationFieldErrors {
  const errors = collectSamlSpConfigurationValidationErrors(values);

  return {
    issuerUri: errors.includes(IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED)
      ? IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED
      : null,
    roleClaimName: errors.includes(SAML_SP_ROLE_CLAIM_VALIDATION_REQUIRED)
      ? SAML_SP_ROLE_CLAIM_VALIDATION_REQUIRED
      : null,
    mappings:
      errors.find(
        (message) =>
          message === IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED
          || message === SAML_SP_INCOMPLETE_MAPPING_ROW_VALIDATION
          || message.startsWith("Duplicate IdP group or role value:"),
      ) ?? null,
  };
}

export function addSamlSpClaimMappingRow(values: SamlSpConfigurationFormValues): SamlSpConfigurationFormValues {
  return {
    ...values,
    mappings: [...values.mappings, createDefaultSamlSpClaimMappingRow("Reader")],
  };
}

export function removeSamlSpClaimMappingRow(
  values: SamlSpConfigurationFormValues,
  rowId: string,
): SamlSpConfigurationFormValues {
  if (values.mappings.length <= 1) {
    return values;
  }

  return {
    ...values,
    mappings: values.mappings.filter((row) => row.rowId !== rowId),
  };
}
