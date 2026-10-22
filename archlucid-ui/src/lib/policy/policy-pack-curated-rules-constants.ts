/** Reserved `PolicyPackContentDocument.metadata` key for curated-rules JSON (shared with backend). */
export const POLICY_PACK_CURATED_RULES_METADATA_V1 = "pack.curatedRules.v1";

/** Expected document `kind` for V1 curated rules samples. */
export const CURATED_RULES_DOCUMENT_KIND = "archlucid.policyPack.curatedRules.v1" as const;

/** Schema reference shown beside AI-drafted single-rule JSON in the policy pack editor. */
export const CURATED_RULE_ROW_SCHEMA_REFERENCE = `{
  "id": "string (kebab-case rule id)",
  "title": "string",
  "description": "string",
  "severity": "Critical|High|Medium|Low",
  "remediationGuidance": "string",
  "evidenceHints": ["string manifest or extractor paths"],
  "frameworkMappings": [{ "framework": "string", "requirement": "string", "control": "optional string" }],
  "priority": "P0|P1|P2"
}`;
