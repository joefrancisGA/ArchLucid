import type { PolicyPackContentDocument } from "@/types/policy-packs";

import {
  CURATED_RULES_DOCUMENT_KIND,
  POLICY_PACK_CURATED_RULES_METADATA_V1,
} from "@/lib/policy-pack-curated-rules-constants";
import {
  buildPolicyPackContentFromGuidedFields,
  type GuidedPolicyFields,
} from "@/lib/policy-pack-guided-content";

export type CuratedRuleSeverity = "Critical" | "High" | "Medium" | "Low";

export type CuratedFrameworkMappingRow = {
  readonly framework: string;
  readonly control?: string;
  readonly requirement?: string;
};

export type CuratedRuleRow = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: CuratedRuleSeverity;
  readonly remediationGuidance: string;
  readonly evidenceHints: readonly string[];
  readonly frameworkMappings: readonly CuratedFrameworkMappingRow[];
};

export type CuratedRulesPackSection = {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly isDefault: boolean;
  readonly suggestedPackType: string;
  readonly policyPackContentDocumentPath: string;
};

export type CuratedRulesDocument = {
  readonly schemaVersion: 1;
  readonly kind: typeof CURATED_RULES_DOCUMENT_KIND;
  readonly pack: CuratedRulesPackSection;
  readonly rules: readonly CuratedRuleRow[];
};

export const CURATED_RULE_SEVERITIES: ReadonlyArray<CuratedRuleSeverity> = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCuratedRuleSeverity(value: unknown): value is CuratedRuleSeverity {
  return value === "Critical" || value === "High" || value === "Medium" || value === "Low";
}

/** Empty row for the form editor. Prefer using {@link createEmptyCuratedRuleRow}. */
export function createEmptyCuratedRuleRow(): CuratedRuleRow {
  return {
    id: "",
    title: "",
    description: "",
    severity: "Medium",
    remediationGuidance: "",
    evidenceHints: [],
    frameworkMappings: [],
  };
}

export function createEmptyCuratedRulesDocument(pack: Partial<CuratedRulesPackSection>): CuratedRulesDocument {
  const base: CuratedRulesPackSection = {
    name: "",
    description: "",
    version: "1.0.0",
    category: "General",
    isDefault: false,
    suggestedPackType: "ProjectCustom",
    policyPackContentDocumentPath: "",
    ...pack,
  };

  return {
    schemaVersion: 1,
    kind: CURATED_RULES_DOCUMENT_KIND,
    pack: base,
    rules: [],
  };
}

function readStringField(rec: Record<string, unknown>, key: string): string | undefined {
  const v = rec[key];

  if (typeof v === "string") {
    return v;
  }

  return undefined;
}

function parseFrameworkMappings(raw: unknown): CuratedFrameworkMappingRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const rows: CuratedFrameworkMappingRow[] = [];

  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }

    const framework = readStringField(item, "framework")?.trim() ?? "";

    if (framework.length === 0) {
      continue;
    }

    rows.push({
      framework,
      control: readStringField(item, "control"),
      requirement: readStringField(item, "requirement"),
    });
  }

  return rows;
}

function parseRuleRow(raw: unknown): CuratedRuleRow | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readStringField(raw, "id")?.trim() ?? "";

  if (id.length === 0) {
    return null;
  }

  const title = readStringField(raw, "title")?.trim() ?? "";
  const description = readStringField(raw, "description") ?? "";
  const sevRaw = readStringField(raw, "severity");
  const severity: CuratedRuleSeverity = isCuratedRuleSeverity(sevRaw) ? sevRaw : "Medium";
  const remediationGuidance = readStringField(raw, "remediationGuidance") ?? "";
  const hintsRaw = raw["evidenceHints"];
  const evidenceHints: string[] = Array.isArray(hintsRaw)
    ? hintsRaw.filter((h): h is string => typeof h === "string").map((h) => h.trim()).filter((h) => h.length > 0)
    : [];

  return {
    id,
    title,
    description,
    severity,
    remediationGuidance,
    evidenceHints,
    frameworkMappings: parseFrameworkMappings(raw["frameworkMappings"]),
  };
}

/** Parses curated document JSON (metadata payload or standalone file). Returns `null` when not shaped like V1. */
export function tryParseCuratedRulesDocumentJson(jsonText: string): CuratedRulesDocument | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const schemaVersion = parsed["schemaVersion"];

  if (schemaVersion !== 1) {
    return null;
  }

  const kind = parsed["kind"];

  if (kind !== CURATED_RULES_DOCUMENT_KIND) {
    return null;
  }

  const packRaw = parsed["pack"];
  const packRec = isRecord(packRaw) ? packRaw : {};
  const pack: CuratedRulesPackSection = {
    name: readStringField(packRec, "name") ?? "",
    description: readStringField(packRec, "description") ?? "",
    version: readStringField(packRec, "version") ?? "1.0.0",
    category: readStringField(packRec, "category") ?? "General",
    isDefault: typeof packRec["isDefault"] === "boolean" ? packRec["isDefault"] : false,
    suggestedPackType: readStringField(packRec, "suggestedPackType") ?? "ProjectCustom",
    policyPackContentDocumentPath: readStringField(packRec, "policyPackContentDocumentPath") ?? "",
  };
  const rulesRaw = parsed["rules"];
  const rules: CuratedRuleRow[] = [];

  if (Array.isArray(rulesRaw)) {
    for (const r of rulesRaw) {
      const row = parseRuleRow(r);

      if (row !== null) {
        rules.push(row);
      }
    }
  }

  return {
    schemaVersion: 1,
    kind: CURATED_RULES_DOCUMENT_KIND,
    pack,
    rules,
  };
}

export function extractCuratedRulesFromPackMetadata(
  metadata: Record<string, string> | undefined,
): CuratedRulesDocument | null {
  if (metadata === undefined) {
    return null;
  }

  const raw = metadata[POLICY_PACK_CURATED_RULES_METADATA_V1];

  if (raw === undefined || raw.trim().length === 0) {
    return null;
  }

  return tryParseCuratedRulesDocumentJson(raw);
}

function splitComplianceKeyLines(text: string): string[] {
  const fromLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (fromLines.length > 0) {
    return fromLines;
  }

  return text
    .split(/[,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Unique list preserving first-seen order. */
function uniquePreserveOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    const k = id.trim();

    if (k.length === 0 || seen.has(k)) {
      continue;
    }

    seen.add(k);
    result.push(k);
  }

  return result;
}

/**
 * Builds the `complianceRuleKeys` facet: additional keys from guided input plus every curated rule `id`
 * (tenant-authored bodies must be keyed for governance filter).
 */
export function mergeComplianceRuleKeysForCurated(
  complianceRuleKeysText: string,
  curatedRuleIds: readonly string[],
): string[] {
  const additional = splitComplianceKeyLines(complianceRuleKeysText);
  const ids = curatedRuleIds.map((x) => x.trim()).filter((x) => x.length > 0);

  return uniquePreserveOrder([...additional, ...ids]);
}

export function validateCuratedRulesDocument(doc: CuratedRulesDocument): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const r of doc.rules) {
    if (r.id.trim().length === 0) {
      errors.push("Each rule needs a non-empty id.");

      continue;
    }

    const canon = r.id.trim().toLowerCase();

    if (seen.has(canon)) {
      errors.push(`Duplicate rule id: ${r.id.trim()}`);
    }

    seen.add(canon);

    if (r.title.trim().length === 0) {
      errors.push(`Rule "${r.id.trim()}" needs a title.`);
    }
  }

  return errors;
}

export function serializeCuratedRulesDocument(doc: CuratedRulesDocument): string {
  return JSON.stringify(doc, null, 2);
}

export type HydrateCuratedFromContentResult = {
  readonly curated: CuratedRulesDocument;
  readonly additionalComplianceKeysText: string;
};

/**
 * Reads `pack.curatedRules.v1` from metadata and splits `complianceRuleKeys` into “additional file keys” vs authored ids.
 */
export function hydrateCuratedFromContentDocument(doc: PolicyPackContentDocument): HydrateCuratedFromContentResult {
  const meta = doc.metadata ?? {};
  const parsed = extractCuratedRulesFromPackMetadata(meta);
  const curatedIds = new Set(parsed?.rules.map((r) => r.id.trim().toLowerCase()) ?? []);
  const keys = doc.complianceRuleKeys ?? [];
  const additionalLines = keys.filter((k) => !curatedIds.has(k.trim().toLowerCase()));
  const additionalComplianceKeysText = additionalLines.join("\n");

  if (parsed !== null) {
    return { curated: parsed, additionalComplianceKeysText };
  }

  return {
    curated: createEmptyCuratedRulesDocument({
      name: "",
      description: "",
      version: "1.0.0",
      category: "General",
      suggestedPackType: "ProjectCustom",
    }),
    additionalComplianceKeysText: keys.join("\n"),
  };
}

export type ComposePublishInput = {
  readonly guided: GuidedPolicyFields;
  readonly curated: CuratedRulesDocument;
  readonly packContext: {
    readonly name: string;
    readonly description: string;
    readonly version: string;
    readonly packType: string;
  };
};

/** Merges guided facets, curated metadata blob, and `complianceRuleKeys` union for `POST .../publish`. */
export function composePolicyPackContentForPublish(input: ComposePublishInput): PolicyPackContentDocument {
  const base: PolicyPackContentDocument = buildPolicyPackContentFromGuidedFields(input.guided);
  const meta = { ...(base.metadata ?? {}) };
  delete meta[POLICY_PACK_CURATED_RULES_METADATA_V1];

  const ruleIds = input.curated.rules.map((r) => r.id.trim()).filter((x) => x.length > 0);

  if (ruleIds.length === 0) {
    return {
      ...base,
      complianceRuleKeys: mergeComplianceRuleKeysForCurated(input.guided.complianceRuleKeysText, []),
      metadata: meta,
    };
  }

  const curatedDoc: CuratedRulesDocument = {
    ...input.curated,
    pack: {
      ...input.curated.pack,
      name: input.packContext.name.trim() || input.curated.pack.name,
      description: input.packContext.description.trim() || input.curated.pack.description,
      version: input.packContext.version.trim() || input.curated.pack.version,
      suggestedPackType: input.packContext.packType.trim() || input.curated.pack.suggestedPackType,
    },
    rules: input.curated.rules,
  };
  meta[POLICY_PACK_CURATED_RULES_METADATA_V1] = JSON.stringify(curatedDoc);

  const mergedKeys = mergeComplianceRuleKeysForCurated(input.guided.complianceRuleKeysText, ruleIds);

  return {
    ...base,
    complianceRuleKeys: mergedKeys,
    metadata: meta,
  };
}

export { CURATED_RULES_DOCUMENT_KIND, POLICY_PACK_CURATED_RULES_METADATA_V1 } from "./policy-pack-curated-rules-constants";
