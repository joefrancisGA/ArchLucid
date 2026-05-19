> **Scope:** Cursor chat prompt to generate `*-rules-v1.json` curated-rules files from pack context. Internal authoring only; not buyer-facing documentation or runtime policy enforcement.

# ArchLucid policy pack — generator prompt

**Purpose:** Paste this prompt (with the pack context section filled in from `PACK_CONTEXTS.md`) into a Cursor chat to produce a `*-rules-v1.json` curated-rules file. Run the critic prompt (`CRITIC_PROMPT.md`) on the output before committing.

**Typical turnaround:** 1 chat session per pack. Expect ~10 minutes generation + 5 minutes critic + 5 minutes human citation spot-check.

---

## THE PROMPT (copy everything below this line into the chat)

---

You are an expert enterprise cloud architect and technical writer authoring curated architecture-review rules for ArchLucid, a governance platform used by enterprise architecture teams and regulated-industry buyers.

Your output is a single JSON file conforming **exactly** to the schema defined below. Do not output any explanation, markdown prose, or wrapper text — only the raw JSON object.

---

### Output JSON schema

```
{
  "schemaVersion": 1,
  "kind": "archlucid.policyPack.curatedRules.v1",
  "pack": {
    "name": "<PACK_DISPLAY_NAME>",
    "description": "<PACK_DESCRIPTION>",
    "version": "1.0.0",
    "category": "<PACK_CATEGORY>",
    "isDefault": true,
    "suggestedPackType": "PlatformDefault",
    "policyPackContentDocumentPath": "docs/samples/policy-packs/<SLUG>.json"
  },
  "rules": [
    {
      "id": "<PREFIX>-NNN",
      "title": "<short imperative title, max 12 words>",
      "description": "<see rules below>",
      "severity": "<Critical|High|Medium|Low>",
      "priority": "<P0|P1|P2>",
      "remediationGuidance": "<see rules below>",
      "evidenceHints": [ "<see vocabulary below>" ],
      "frameworkMappings": [ { "framework": "...", "control|theme|requirement": "..." } ]
    }
  ]
}
```

---

### Evidence hint vocabulary (ONLY use tokens from this list)

The ArchLucid evidence engine reads these fields from architecture manifests and Azure extractor output. Evidence hints must be drawn **only** from the following vocabulary. Do not invent new field names.

**Manifest top-level fields:**
- `systemName`
- `systemDescription`
- `metadata.ManifestVersion`
- `metadata.ParentManifestVersion`
- `metadata.ChangeDescription`
- `metadata.DecisionTraceIds`

**Services:**
- `services[].ServiceName`
- `services[].Purpose`
- `services[].Tags`
- `services[].RuntimePlatform`
- `services[].RequiredControls`

**Datastores:**
- `datastores[].DatastoreType`
- `datastores[].RuntimePlatform`
- `datastores[].PrivateEndpointRequired`
- `datastores[].EncryptionAtRestRequired`
- `datastores[].Tags`

**Governance block:**
- `governance.RequiredControls`
- `governance.PolicyConstraints`
- `governance.ComplianceTags`
- `governance.blockCommitOnCritical`
- `governance.blockCommitMinimumSeverity`

**Relationships:**
- `relationships[].relationshipType`
- `relationships[].source`
- `relationships[].target`

**Azure extractor manifest fields:**
- `azureExtractor.manifest.SubscriptionId`
- `azureExtractor.manifest.ScopeDescriptor`
- `azureExtractor.manifest.SwitchesUsed`
- `azureExtractor.manifest.RawJson`

---

### Field-level authoring rules

**`id`**
- Format: `<prefix>-NNN` (three-digit zero-padded number, e.g. `arc-ampe-pr-001`).
- Use the sub-corpus prefix from the pack context section below.
- Must be unique across all rules in the file.

**`title`**
- Imperative verb phrase. Max 12 words.
- Good: "Encryption at rest required for regulated datastores"
- Bad: "The system should have encryption"

**`description`**
- 2–4 sentences. What the architecture manifest or extractor evidence **should show** and **why** it matters for this framework theme. Do not tell the architect what to do (that is `remediationGuidance`).
- Must include the phrase: "Thematic mapping only — not certification." on the final sentence when the rule cites a regulatory or certification framework.
- Do not pad with obvious statements. Be specific about what a gap looks like.

**`severity`**
- `Critical` — reserved for controls where a gap directly enables a serious breach, data loss, or regulatory violation. Use sparingly (max 10% of rules per pack).
- `High` — significant architectural risk; should be addressed before production.
- `Medium` — meaningful gap; plan to address within a sprint or two.
- `Low` — best practice; address when convenient.
- **Do not assign `Critical` to rules that depend on interpretive business context** (e.g. "comply with federal law" — you cannot determine that from an architecture manifest alone).

**`priority`**
- `P0` — must-have. An unaddressed P0 indicates the architecture fails the most basic expectations for this framework area. Assign P0 to rules sourced from **mandatory** / **high-priority** sections of the source framework document.
- `P1` — should-have. Assign to rules from **moderate-priority** or **standard** framework sections.
- `P2` — nice-to-have / mature posture. Assign to rules from optional, advanced, or "other priority" framework sections.
- Target distribution: ~20% P0, ~50% P1, ~30% P2 (adjust for framework — prescriptive regulatory packs skew P0-heavy).
- `priority` and `severity` are **orthogonal**: a P0 rule can be `Medium` severity (it matters but doesn't directly enable breach). A P2 rule can be `High` severity (advanced posture but consequential if the pack has widened floor).

**`remediationGuidance`**
- 1–3 sentences. Specific instructions using evidence hint field names. Tell the architect exactly which manifest fields to populate or verify.
- Must reference at least one field from the evidence vocabulary above.
- Do not say "contact your compliance team" or "review documentation" — those are filler phrases.

**`evidenceHints`**
- Array of strings from the evidence vocabulary above. 2–5 hints per rule.
- Choose hints that a reviewer would **actually check** to evaluate this rule. Do not list every field.

**`frameworkMappings`**
- Array of objects. Each object has `"framework"` (string) plus one of: `"control"`, `"theme"`, `"requirement"`, `"category"`, `"chapter"`.
- Always include the framework **version or date** in the framework string if it is version-specific (e.g. `"NIST SP 800-53 Rev. 5"`, `"OWASP ASVS v4.0.3"`, `"CIS Azure Foundations Benchmark v2.0"`, `"ARC-AMPE Volume I v1.02 (CMS, 2025-04-10)"`).
- Always add a final entry: `{ "framework": "Disclaimer", "theme": "Thematic architecture-review mapping; not <FRAMEWORK_SHORT_NAME> certification, conformity assessment, or legal classification." }`.
- **Do not fabricate control IDs.** If you are not certain a control ID exists verbatim in the source document, use a theme or chapter reference instead (e.g. `"theme": "Chapter 2 — Data Protection"` rather than inventing `"control": "DP-7.3"`).
- Maximum 4 framework entries per rule (including Disclaimer). More than 4 is noise.

---

### Quality invariants (self-check before finalising output)

Before emitting the JSON, verify every rule passes all of these:

1. `id` is unique within this file and matches the prefix pattern.
2. `title` is 12 words or fewer.
3. `description` does not start with "The rule" or "This rule".
4. `description` ends with "Thematic mapping only — not certification." if a regulatory framework is cited.
5. `remediationGuidance` contains at least one evidence-vocabulary field name.
6. All `evidenceHints` values are drawn from the vocabulary list above.
7. `severity` is not `Critical` for any rule that requires business/legal interpretation beyond architecture evidence.
8. No `frameworkMappings` entry contains a control ID that was invented (guessed) — use theme/chapter if uncertain.
9. The final `frameworkMappings` entry is the Disclaimer entry.
10. `priority` values respect the P0/P1/P2 definition above.
11. Total `Critical` rules ≤ 10% of all rules in the file.
12. Rule count matches the target count stated in the pack context below.

---

### Pack context — FILL IN BEFORE RUNNING

```
PACK_DISPLAY_NAME:   <copy from PACK_CONTEXTS.md>
PACK_DESCRIPTION:    <copy from PACK_CONTEXTS.md>
PACK_CATEGORY:       <copy from PACK_CONTEXTS.md>
SLUG:                <copy from PACK_CONTEXTS.md>
RULE_PREFIX:         <copy from PACK_CONTEXTS.md>
TARGET_RULE_COUNT:   <copy from PACK_CONTEXTS.md>
FRAMEWORK_SHORT_NAME:<copy from PACK_CONTEXTS.md>

SUB-CORPORA AND RULE DISTRIBUTION:
<paste the sub-corpus table from PACK_CONTEXTS.md>

SOURCE FRAMEWORK SUMMARY:
<paste the source summary from PACK_CONTEXTS.md — this is the most important context for quality>

DISCLAIMER TEXT (use verbatim in every Disclaimer frameworkMappings entry):
<copy from PACK_CONTEXTS.md>

ADJACENT PACKS (do not duplicate — cross-link via frameworkMappings instead):
<paste from PACK_CONTEXTS.md>
```

---

### Example rule (use as quality bar — do not include in output)

```json
{
  "id": "arc-ampe-pr-001",
  "title": "Data-in-transit encryption documented for Exchange-facing surfaces",
  "description": "Architecture manifests serving ACA / Medicaid workloads must identify all ingress and egress paths that carry PII or PHI and record the TLS posture (version, cipher policy, mutual TLS where applicable). Gaps here indicate the review cannot confirm the transmission-confidentiality baseline required by ARC-AMPE. Thematic mapping only — not certification.",
  "severity": "High",
  "priority": "P0",
  "remediationGuidance": "Tag each ingress service with the encryption profile in services[].Tags (e.g. 'tls: 1.3', 'mtls: required') and describe TLS termination boundaries and mutual-auth obligations in metadata.ChangeDescription and governance.PolicyConstraints.",
  "evidenceHints": [
    "services[].Tags",
    "services[].RuntimePlatform",
    "governance.PolicyConstraints",
    "metadata.ChangeDescription"
  ],
  "frameworkMappings": [
    {
      "framework": "ARC-AMPE Volume I v1.02 (CMS, 2025-04-10)",
      "theme": "ACA AE CSF Profile — PROTECT / PR.DS-2: Data-in-transit is protected (High Priority Subcategory)"
    },
    {
      "framework": "NIST SP 800-53 Rev. 5",
      "control": "SC-8",
      "requirement": "Transmission confidentiality and integrity"
    },
    {
      "framework": "Disclaimer",
      "theme": "Thematic architecture-review mapping; not ARC-AMPE conformity, SSPP authoring, or legal classification."
    }
  ]
}
```

---

Now produce the complete JSON file for the pack context filled in above. Output raw JSON only — no prose, no markdown fences.
