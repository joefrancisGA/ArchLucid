import {
  composePolicyPackContentForPublish,
  validateCuratedRulesDocument,
  type CuratedRulesDocument,
} from "@/lib/policy-pack-curated-rules-v1";
import type { GuidedPolicyFields } from "@/lib/policy-pack-guided-content";

const EMPTY_GUIDED_FIELDS: GuidedPolicyFields = {
  complianceRuleKeysText: "",
  alertRuleIdsText: "",
  compositeAlertRuleIdsText: "",
  metadataLinesText: "",
};

export type ApplyGeneratedCuratedPolicyPackInput = {
  readonly document: CuratedRulesDocument;
  readonly existingName: string;
  readonly existingDescription: string;
  readonly publishVersion: string;
  readonly packType: string;
};

export type ApplyGeneratedCuratedPolicyPackResult = {
  readonly name: string;
  readonly description: string;
  readonly packType: string;
  readonly publishVersion: string;
  readonly contentJson: string;
  readonly validationErrors: readonly string[];
  readonly ruleCount: number;
};

/** Merge AI-generated curated rules into tenant-owned pack draft fields for create/publish. */
export function applyGeneratedCuratedPolicyPack(
  input: ApplyGeneratedCuratedPolicyPackInput,
): ApplyGeneratedCuratedPolicyPackResult {
  const validationErrors: readonly string[] = validateCuratedRulesDocument(input.document);
  const generatedName = input.document.pack.name.trim();
  const generatedDescription = input.document.pack.description.trim();
  const name =
    input.existingName.trim().length > 0 ? input.existingName.trim() : generatedName;
  const description =
    input.existingDescription.trim().length > 0
      ? input.existingDescription.trim()
      : generatedDescription;
  const suggestedPackType = input.document.pack.suggestedPackType.trim();
  const packType = suggestedPackType.length > 0 ? suggestedPackType : input.packType;
  const generatedVersion = input.document.pack.version.trim();
  const publishVersion = generatedVersion.length > 0 ? generatedVersion : input.publishVersion;
  const ruleCount = input.document.rules.length;

  if (validationErrors.length > 0) {
    return {
      name,
      description,
      packType,
      publishVersion,
      contentJson: "",
      validationErrors,
      ruleCount,
    };
  }

  const contentDocument = composePolicyPackContentForPublish({
    guided: EMPTY_GUIDED_FIELDS,
    curated: input.document,
    packContext: {
      name,
      description,
      version: publishVersion,
      packType,
    },
  });

  return {
    name,
    description,
    packType,
    publishVersion,
    contentJson: JSON.stringify(contentDocument, null, 2),
    validationErrors,
    ruleCount,
  };
}
