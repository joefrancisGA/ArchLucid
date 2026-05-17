import type { PolicyPackContentDocument } from "@/types/policy-packs";

import { DEFAULT_POLICY_PACK_CONTENT_JSON } from "@/lib/policy-pack-default-content";

export type GuidedPolicyFields = {
  readonly complianceRuleKeysText: string;
  readonly alertRuleIdsText: string;
  readonly compositeAlertRuleIdsText: string;
  readonly metadataLinesText: string;
};

function splitNonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitCommaList(text: string): string[] {
  return text
    .split(/[,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Parses optional `key=value` lines (one per line) into metadata; skips malformed rows. */
function parseMetadataLines(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = splitNonEmptyLines(text);

  for (const line of lines) {
    const eq = line.indexOf("=");

    if (eq <= 0) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();

    if (key.length === 0) {
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * Builds a {@link PolicyPackContentDocument} from low-code fields. Empty guided fields fall back to
 * {@link DEFAULT_CONTENT} shape for arrays/objects via JSON round-trip of the default skeleton.
 */
export function buildPolicyPackContentFromGuidedFields(fields: GuidedPolicyFields): PolicyPackContentDocument {
  const base: PolicyPackContentDocument = JSON.parse(DEFAULT_CONTENT) as PolicyPackContentDocument;
  const keysFromMultiline = splitNonEmptyLines(fields.complianceRuleKeysText);
  const keysFromCommas = splitCommaList(fields.complianceRuleKeysText);
  const complianceRuleKeys = keysFromMultiline.length > 0 ? keysFromMultiline : keysFromCommas;

  const alertRuleIds =
    splitNonEmptyLines(fields.alertRuleIdsText).length > 0
      ? splitNonEmptyLines(fields.alertRuleIdsText)
      : splitCommaList(fields.alertRuleIdsText);

  const compositeIds =
    splitNonEmptyLines(fields.compositeAlertRuleIdsText).length > 0
      ? splitNonEmptyLines(fields.compositeAlertRuleIdsText)
      : splitCommaList(fields.compositeAlertRuleIdsText);

  const metadataExtra = parseMetadataLines(fields.metadataLinesText);

  return {
    ...base,
    complianceRuleKeys: complianceRuleKeys.length > 0 ? complianceRuleKeys : base.complianceRuleKeys,
    alertRuleIds: alertRuleIds.length > 0 ? alertRuleIds : base.alertRuleIds,
    compositeAlertRuleIds: compositeIds.length > 0 ? compositeIds : base.compositeAlertRuleIds,
    metadata: { ...base.metadata, ...metadataExtra },
  };
}

export function guidedFieldsFromContentDocument(doc: PolicyPackContentDocument): GuidedPolicyFields {
  const lines: string[] = [];
  const ruleKeys = doc.complianceRuleKeys ?? [];

  for (const k of ruleKeys) {
    lines.push(k);
  }

  const alertLines = (doc.alertRuleIds ?? []).join("\n");
  const compositeLines = (doc.compositeAlertRuleIds ?? []).join("\n");
  const meta = doc.metadata ?? {};
  const metaLines = Object.entries(meta)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return {
    complianceRuleKeysText: lines.join("\n"),
    alertRuleIdsText: alertLines,
    compositeAlertRuleIdsText: compositeLines,
    metadataLinesText: metaLines,
  };
}
