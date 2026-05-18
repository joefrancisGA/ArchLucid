# ArchLucid policy pack — critic prompt

**Purpose:** Paste this prompt (with the generated JSON attached) into a Cursor chat to perform a structured QA pass before committing the curated-rules file. The critic pass catches the failure modes a generator is most likely to introduce.

**When to run:** After the generator produces the JSON. Before opening a PR or running the generator script.

**Expected output:** A numbered issue list. If zero issues, output "PASS — no issues found." followed by a brief confidence summary.

---

## THE PROMPT (copy everything below this line into the chat)

---

You are a senior technical reviewer performing a structured QA pass on an ArchLucid curated policy pack JSON file. You will be given a JSON file conforming to the `archlucid.policyPack.curatedRules.v1` schema. Your job is to find every defect in the file against the checklist below.

Do not suggest stylistic improvements unless they violate a checklist item. Be specific: cite the rule `id` and the exact field for every issue. Output a numbered list. If you find zero issues, output "PASS — no issues found." followed by a one-paragraph confidence summary.

---

### Checklist — run every item against every rule

#### A. Schema / structural (mechanical)

| # | Check |
|---|-------|
| A1 | Every rule has all required fields: `id`, `title`, `description`, `severity`, `priority`, `remediationGuidance`, `evidenceHints` (non-empty array), `frameworkMappings` (non-empty array). Flag any missing field. |
| A2 | `id` values are unique within the file. Flag any duplicate. |
| A3 | `id` values match the expected prefix pattern for this pack (stated in the pack context below). Flag any that deviate. |
| A4 | `id` numbers are sequential (e.g. `-001`, `-002`…). Flag any gap or out-of-order numbering. |
| A5 | `severity` is exactly one of: `Critical`, `High`, `Medium`, `Low`. Flag any other value. |
| A6 | `priority` is exactly one of: `P0`, `P1`, `P2`. Flag any other value. |
| A7 | The `evidenceHints` array contains only values from the approved vocabulary. The approved vocabulary is:  `systemName`, `systemDescription`, `metadata.ManifestVersion`, `metadata.ParentManifestVersion`, `metadata.ChangeDescription`, `metadata.DecisionTraceIds`, `services[].ServiceName`, `services[].Purpose`, `services[].Tags`, `services[].RuntimePlatform`, `services[].RequiredControls`, `datastores[].DatastoreType`, `datastores[].RuntimePlatform`, `datastores[].PrivateEndpointRequired`, `datastores[].EncryptionAtRestRequired`, `datastores[].Tags`, `governance.RequiredControls`, `governance.PolicyConstraints`, `governance.ComplianceTags`, `governance.blockCommitOnCritical`, `governance.blockCommitMinimumSeverity`, `relationships[].relationshipType`, `relationships[].source`, `relationships[].target`, `azureExtractor.manifest.SubscriptionId`, `azureExtractor.manifest.ScopeDescriptor`, `azureExtractor.manifest.SwitchesUsed`, `azureExtractor.manifest.RawJson`. Flag any token not on this list. |
| A8 | Each `frameworkMappings` entry has a `framework` key plus exactly one of `control`, `theme`, `requirement`, `category`, `chapter`. Flag any entry missing the second key or having multiple content keys. |
| A9 | The last `frameworkMappings` entry for every rule has `"framework": "Disclaimer"`. Flag any rule where the Disclaimer entry is absent or not last. |
| A10 | Total rule count matches the target count stated in the pack context below. Flag if count is off. |

#### B. Severity / priority discipline

| # | Check |
|---|-------|
| B1 | No more than 10% of rules are `Critical`. Count Critical rules and flag if over the threshold. |
| B2 | `Critical` is not assigned to any rule whose `description` or `remediationGuidance` references interpretive business, legal, or organisational judgment that cannot be determined from an architecture manifest (e.g. "maintain compliance with federal law", "ensure your contract requires…", "verify with legal counsel"). Flag any such assignment. |
| B3 | `P0` rules correspond to framework sections described as mandatory, baseline, high-priority, or must-have. If a rule is `P0` but maps only to optional, informative, or nice-to-have framework content, flag it. |
| B4 | Check for inverted severity vs priority: a rule should not be `Critical` severity AND `P2` priority (implying it is a nice-to-have but also a breach risk). Flag any such combination as requiring explicit justification. |

#### C. Framework citation accuracy (the highest-risk failure mode)

| # | Check |
|---|-------|
| C1 | For each `frameworkMappings` entry, check whether the control ID, chapter number, or standard section cited **could plausibly exist** in the named framework and version. Flag any citation that looks invented (e.g. control families or numbers that don't match the known structure of the standard). Specifically watch for: NIST 800-53 controls outside the known family codes (AC, AT, AU, CA, CM, CP, IA, IR, MA, MP, PE, PL, PM, PS, PT, RA, SA, SC, SI, SR, UBA); OWASP ASVS chapters outside V1–V14; CIS Azure controls outside section 1–9; ARC-AMPE references that don't match Volume I Tables 6–10 or the seven Pillar descriptions. |
| C2 | For NIST 800-53 citations: the family code must be valid (list above). The number after the dash must be plausible (1–99 for most families). Enhancement numbers in parentheses (e.g. SC-8(1)) are valid — flag only if the base control or enhancement doesn't exist in 800-53 R5 to your knowledge. |
| C3 | For OWASP ASVS citations: chapters V1–V14 are valid. Flag any chapter number outside this range. |
| C4 | The Disclaimer entry must contain the word "not" and the framework's short name (or a synonym) and at least one of: "certification", "conformity", "legal", "attestation". Flag any Disclaimer entry missing these elements. |
| C5 | Framework version strings must be explicit (e.g. "NIST SP 800-53 Rev. 5" not "NIST 800-53"). Flag any vague version reference. |

#### D. Description / remediation quality

| # | Check |
|---|-------|
| D1 | No `description` starts with "The rule" or "This rule". Flag any violation. |
| D2 | No `description` is shorter than 40 words. Flag any that are too short (thin rules provide no value). |
| D3 | No `description` says what the architect **should do** — that belongs in `remediationGuidance`. Flag descriptions that contain imperative instructions. |
| D4 | Every `remediationGuidance` references at least one evidence-vocabulary field name. Flag any that contain only generic advice. |
| D5 | No `remediationGuidance` contains the phrases: "contact your compliance team", "review the documentation", "consult your legal counsel", "refer to your policy". These are filler. Flag any occurrence. |
| D6 | No `title` exceeds 12 words. Count words and flag violations. |
| D7 | For packs that cite regulatory frameworks: every rule's `description` must end with the sentence "Thematic mapping only — not certification." Flag any rule that cites a regulatory or certification framework in `frameworkMappings` but lacks this sentence in `description`. |

#### E. Cross-pack overlap

| # | Check |
|---|-------|
| E1 | Using the adjacent-packs list in the pack context, flag any rule whose `title` and `description` clearly duplicate a rule that should live in an adjacent pack rather than this one. (Use judgment — some overlap in framing is acceptable; verbatim or near-verbatim duplication of another pack's core rules is not.) |

#### F. Priority distribution

| # | Check |
|---|-------|
| F1 | Count P0, P1, and P2 rules. Flag if P0 exceeds 30% of total rules (over-indexing on must-haves means the pack won't give progressive-disclosure value to pilots). |
| F2 | Flag if P2 is zero (means the pack has no advanced-posture content, limiting value for mature tenants who have widened the floor). |

---

### Pack context — FILL IN BEFORE RUNNING

```
PACK_DISPLAY_NAME:   <copy from PACK_CONTEXTS.md>
SLUG:                <copy from PACK_CONTEXTS.md>
EXPECTED_ID_PREFIX:  <copy from PACK_CONTEXTS.md>
TARGET_RULE_COUNT:   <copy from PACK_CONTEXTS.md>
FRAMEWORK_SHORT_NAME:<copy from PACK_CONTEXTS.md>

ADJACENT PACKS (for E1 check):
<paste from PACK_CONTEXTS.md>
```

---

Now paste the generated JSON below this line and run the checklist.

```
<PASTE JSON HERE>
```
