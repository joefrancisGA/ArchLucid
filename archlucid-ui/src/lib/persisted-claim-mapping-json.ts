export type PersistedClaimMappingJsonDocument = {
  roleClaimName?: string;
  mappings?: { idpValue?: string; archLucidRole?: string }[];
  customGroupClaimRegex?: string | null;
};

function readOptionalString(
  record: Record<string, unknown>,
  camelName: string,
  pascalName: string,
): string | undefined {
  const value = record[camelName] ?? record[pascalName];

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

function readOptionalRegex(record: Record<string, unknown>): string | null | undefined {
  const value = record.customGroupClaimRegex ?? record.CustomGroupClaimRegex;

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

function readMappingEntries(
  value: unknown,
): { idpValue?: string; archLucidRole?: string }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return {};
    }

    const row = entry as Record<string, unknown>;

    return {
      idpValue: readOptionalString(row, "idpValue", "IdpValue"),
      archLucidRole: readOptionalString(row, "archLucidRole", "ArchLucidRole"),
    };
  });
}

/** Reads claim-mapping JSON saved by activation. Older rows use PascalCase property names. */
export function parsePersistedClaimMappingJson(
  claimMappingJson: string | undefined,
): PersistedClaimMappingJsonDocument | null {
  if (typeof claimMappingJson !== "string" || claimMappingJson.trim().length === 0) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(claimMappingJson);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  return {
    roleClaimName: readOptionalString(record, "roleClaimName", "RoleClaimName"),
    mappings: readMappingEntries(record.mappings ?? record.Mappings),
    customGroupClaimRegex: readOptionalRegex(record),
  };
}
