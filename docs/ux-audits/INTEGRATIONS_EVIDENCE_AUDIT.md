# Integrations and Evidence-Ingestion Experience Audit

**Date:** 2026-06-28  
**Scope:** All operator-facing integrations, evidence intake, and cloud-connection surfaces in `archlucid-ui/src/`  
**Objective:** ArchLucid must not look like an Azure assessment tool only. Azure is one evidence source. The product vision is broader: architecture review, governance, evidence, findings, decision records, risk analysis, compliance assessment, and architecture intelligence.  
**Backlog items:** TB-481–TB-500 (20 findings)  
**Conflicts with prior sessions:** None. All 20 findings address new surfaces or new dimensions not covered by TB-431–480 or N01–N19.

---

## Summary statistics

| Severity | Count |
| --- | ---: |
| P0 — Blocker | 2 |
| P1 — Credibility / clarity | 10 |
| P2 — Polish / hygiene | 8 |
| **Total** | **20** |

---

## 1. Diagnosis of integration/evidence experience

ArchLucid has done substantial work to make the first-run evidence flow multi-cloud: the `WizardStepEvidenceUpload` source picker offers Azure, AWS, and GCP inventory ZIPs, all marked "Fastest," alongside brief, documents, diagrams, IaC, and demo. The `CloudConnectionsPage` explains manual upload as the default with Tier-2 automation as optional. The `onboarding-secondary-surfaces.ts` guard explicitly bans phrases like "must connect Azure before."

However, the implementation has not fully caught up with the intent. Several specific surfaces still treat Azure as the primary or exclusive evidence path:

- The cloud-target dropdown in the wizard identity step explicitly labels AWS and GCP as "V1.1 deep analysis" while marking Azure as the "accelerated V1 path" — despite AWS/GCP Tier-1 ZIPs being available and marked "Fastest" in the very next wizard step.
- The evidence wizard step defaults to `azure-export` as the selected source.
- The 7-step onboarding checklist (Core Pilot Steps) has "Upload Azure extractor ZIP" as step 4 — Azure-specific in the primary guided path.
- The baseline-first wizard path notice says "upload the Azure extractor ZIP on the next step."
- The optional enrichment collapsible in the full wizard is titled "Add Azure inventory ZIP."
- The demo source description calls the demo package a "bundled synthetic Azure extractor package."

Taken together, a first-time operator — even one with AWS or GCP workloads — encounters Azure in every primary guidance surface before reaching the broader evidence source picker. The product reads as Azure-first with multi-cloud as an afterthought.

Evidence provenance is partially implemented: `FindingTrustChip` correctly shows trust levels, `ExplainabilityTraceTree` shows trace trees. The main gap is the trust chip label "Citation missing" which is technically correct but buyer-hostile and gives no guidance.

---

## 2. Azure-drift findings

| ID | Sev | Surface | Current | Problem |
| --- | --- | --- | --- | --- |
| E01 | P0 | `WizardStepIdentity` cloud target dropdown | AWS = "intent capture — V1.1 deep analysis", GCP = "intent capture — V1.1 deep analysis" | Contradicts `wizard-evidence-source-options.ts` which marks both as `"accelerated"` (Fastest). Tells AWS/GCP customers they get sub-analysis until V1.1. |
| E02 | P0 | `WizardStepEvidenceUpload` | `useState("azure-export")` — Azure ZIP upload panel is the default | Azure is pre-selected. Every user must actively switch away from Azure. |
| E03 | P1 | `CORE_PILOT_STEPS[3].title` | `"Upload Azure extractor ZIP"` | Step 4 of the 7-step onboarding pilot checklist is Azure-only. No equivalent for AWS/GCP. |
| E04 | P1 | `WizardStepPreset` baseline-first notice | `"upload the Azure extractor ZIP on the next step"` | Azure-only. |
| E05 | P1 | `WizardStepAzureContext` collapsible label | `"Add Azure inventory ZIP"` | Only Azure gets a dedicated optional-enrichment step in the full wizard. |
| E06 | P1 | `WizardStepIdentity` footer hint | `"Azure export accelerates topology and cost findings when InfoSec approves the script."` | Azure is the only cloud named in the helper text below the cloud target. |
| E07 | P1 | `WizardStepEvidenceUpload` demo panel | `"Choose a bundled synthetic Azure extractor package"` | Demo is cloud-agnostic but described as Azure. |
| E08 | P1 | `AzureExtractorPackageZipField` | Label: `"Azure packager ZIP"`, side-effect: `setValue("cloudProvider", "Azure")` | Visible Azure label + silent cloudProvider override. |

---

## 3. Evidence-provenance gaps

| ID | Sev | Surface | Current | Problem |
| --- | --- | --- | --- | --- |
| E09 | P1 | `InProductEvidenceChecklist` row | `"API reachable (/health/ready)"` | Internal API route visible in the first-run customer checklist. |
| E10 | P1 | `Tier1InventoryZipUploadPanel` drop-zone hint | `"Client-side checks require manifest.json (schemaVersion 1) and resources.json"` | Internal schema version and file names shown in happy-path guidance. |
| E11 | P1 | `WizardStepEvidenceUpload` description | `"a Tier-1 cloud inventory ZIP"` | "Tier-1" is an internal tier label undefined to customers. |
| E12 | P1 | `FindingTrustChip` | Label: `"Citation missing"` | Buyer-hostile label; no guidance on what to do. |
| E13 | P1 | `CORE_PILOT_STEPS[3]` | Step 4 only mentions cloud inventory; no guidance for brief/doc-only customers | Creates impression that non-cloud reviews are incomplete. |

---

## 4. Recommended first-hour evidence model

ArchLucid should present the following mental model in every first-run surface:

> **ArchLucid works with any evidence you have.**  
> — Start with a brief or attach documents, diagrams, or IaC files right now.  
> — Add a cloud inventory ZIP later (Azure, AWS, or GCP) to accelerate cost and topology findings.  
> — Connect a cloud account for automated, scheduled inventory refresh (optional, requires InfoSec approval).

**Surfaces to update for this model:**

1. **Evidence step default** → `"brief"` (not `"azure-export"`) — TB-482
2. **Cloud target dropdown** → AWS/GCP labels should not say "V1.1" — TB-481
3. **Core Pilot step 4** → cloud-agnostic title and a note that document/brief reviews skip it — TB-483, TB-493
4. **Baseline-first notice** → say "cloud inventory ZIP" not "Azure extractor ZIP" — TB-484
5. **Optional enrichment collapsible** → "Add cloud inventory ZIP" — TB-485
6. **Identity step footer** → all three clouds named — TB-486
7. **Demo source description** → "bundled example review scenario" — TB-487

---

## 5. P0 blockers

### E01 — TB-481: AWS/GCP cloud-target labels contradict available evidence sources

**Why P0:** A customer who runs on AWS or GCP selects their cloud target in the wizard identity step and reads "intent capture — V1.1 deep analysis." They infer ArchLucid does not provide real analysis for their cloud today. They may abandon the review. In the very next wizard step, the evidence source picker offers their cloud ZIP as "Fastest" — the product says two contradictory things in adjacent steps.

**Fix:** In `WizardStepIdentity.tsx`, change:
- `"Amazon Web Services (intent capture — V1.1 deep analysis)"` → `"Amazon Web Services (cloud inventory ZIP available)"`
- `"Google Cloud Platform (intent capture — V1.1 deep analysis)"` → `"Google Cloud Platform (cloud inventory ZIP available)"`

Update the inline tooltip: remove "Aws and Gcp capture target-cloud intent for multi-cloud RFPs; attach Terraform or other IaC for best results until V1.1 deep analysis ships."

---

### E02 — TB-482: Evidence step defaults to Azure ZIP upload

**Why P0:** Every user who reaches the evidence step sees the Azure upload panel by default — including AWS customers, GCP customers, and anyone with only documents. The default is the strongest signal to users about what the product expects. An Azure default reinforces the "Azure assessment tool" perception.

**Fix:** In `WizardStepEvidenceUpload.tsx`, change `useState<WizardEvidenceSourceId>("azure-export")` → `useState<WizardEvidenceSourceId>("brief")`.

---

## 6. P1 improvements

### E03 — TB-483: Core Pilot step 4 Azure-specific

Rename step 4 `title` from `"Upload Azure extractor ZIP"` to `"Upload cloud inventory evidence"`. Update `shortBody` to acknowledge all three clouds.

### E04 — TB-484: Baseline-first notice Azure-only

Replace `"upload the Azure extractor ZIP on the next step"` with `"upload a cloud inventory ZIP on the next step"` in `WizardStepPreset.tsx`.

### E05 — TB-485: Optional enrichment collapsible Azure-only

Rename collapsible trigger from `"Add Azure inventory ZIP"` to `"Add cloud inventory ZIP"`. Replace `AzureExtractorQuickStartCommandPanel` with `CloudInventoryExtractorCommandPanel`. Update inner description to be cloud-agnostic.

### E06 — TB-486: Identity step footer hint Azure-only

Change `"Azure export accelerates..."` to `"A cloud inventory ZIP (Azure, AWS, or GCP) accelerates..."`.

### E07 — TB-487: Demo source says "Azure extractor package"

Change `"Choose a bundled synthetic Azure extractor package"` to `"Choose a bundled example review scenario"`.

### E08 — TB-488: AzureExtractorPackageZipField visible label and cloudProvider side-effect

Change visible label from `"Azure packager ZIP"` to `"Cloud inventory ZIP"`. Add JSDoc warning about the `cloudProvider: "Azure"` side-effect.

### E09 — TB-489: Technical API path in first-run checklist

Change `"API reachable (/health/ready)"` to `"Service connectivity"` in `InProductEvidenceChecklist.tsx`.

### E10 — TB-490: Schema validation hint exposed in upload drop zone

Change `"Client-side checks require manifest.json (schemaVersion 1) and resources.json at the archive root."` to `"Drop the inventory ZIP output from the extractor script. The file is validated locally before upload."` in `Tier1InventoryZipUploadPanel.tsx`.

### E11 — TB-491: "Tier-1" internal label in wizard description

Remove "Tier-1" from `WizardStepEvidenceUpload` description and `wizard-evidence-source-options.ts` descriptions.

### E12 — TB-492: "Citation missing" finding label

Change `FindingTrustChip` `citation-missing` label from `"Citation missing"` to `"No evidence linked"`. Update tooltip to include actionable direction.

### E13 — TB-493: Core Pilot step 4 gives no guidance for brief/doc-only customers

After TB-483, update `CORE_PILOT_STEPS[3].detail` to say: "If you are using brief, document, or diagram evidence only, skip this step — findings will still run and may have lower confidence on cost claims."

---

## 7. P2 polish and code hygiene

| ID | TB | Finding | Fix |
| --- | --- | --- | --- |
| E14 | TB-494 | `AzureExtractorZipDropZone` used for multi-cloud ZIPs | Add JSDoc naming note; plan V1.1 rename |
| E15 | TB-495 | Legacy `AzureExtractorQuickStartCommandPanel` alongside new `CloudInventoryExtractorCommandPanel` | Migrate remaining usages to new component; deprecate legacy |
| E16 | TB-496 | `buildReadinessAzureExtractorSummary` name implies Azure-only | Export as `buildReadinessCloudEvidenceSummary`; deprecate old name |
| E17 | TB-497 | "Skip evidence for now" has no quality context | Add helper note explaining skipping is OK and evidence can be added later |
| E18 | TB-498 | `READINESS_AZURE_EXTRACTOR_LABEL` const name Azure-specific | Export alias `READINESS_CLOUD_EVIDENCE_LABEL`; deprecate old |
| E19 | TB-499 | "Full walkthrough" link anchor generic | Change to "Open setup guide" in `InProductEvidenceChecklist.tsx` |
| E20 | TB-500 | `AzureExtractorDemoScenarioId` type name Azure-specific | Add `DemoReviewScenarioId` alias and `DEFAULT_DEMO_REVIEW_SCENARIO_ID`; deprecate originals |

---

## 8. Cursor-ready patch instructions

### Batch 1 — P0 (must-fix before next demo, ~30 min)

**TB-482 — Change evidence step default to "brief":**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepEvidenceUpload.tsx
Find:   const [selectedSourceId, setSelectedSourceId] = useState<WizardEvidenceSourceId>("azure-export");
Change: const [selectedSourceId, setSelectedSourceId] = useState<WizardEvidenceSourceId>("brief");
```

**TB-481 — Fix AWS/GCP cloud-target labels:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepIdentity.tsx
Find:   "Amazon Web Services (intent capture — V1.1 deep analysis)"
Change: "Amazon Web Services (cloud inventory ZIP available)"

Find:   "Google Cloud Platform (intent capture — V1.1 deep analysis)"
Change: "Google Cloud Platform (cloud inventory ZIP available)"

Find (hint tooltip): "Aws and Gcp capture target-cloud intent for multi-cloud RFPs; attach Terraform or other IaC for best results until V1.1 deep analysis ships."
Change: "Choose the cloud target that matches your workload. AWS and GCP inventory ZIPs are available as accelerated evidence sources."

Find (footer hint): "Evidence-only is the default first-pilot path. Azure export accelerates topology and cost findings when InfoSec approves the script."
Change: "Evidence-only is the default first-pilot path. A cloud inventory ZIP (Azure, AWS, or GCP) accelerates topology and cost findings when your InfoSec team approves the extractor script."
```

---

### Batch 2 — P1 wizard copy (1–2 hours)

**TB-484 — Baseline-first notice:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepPreset.tsx
Find:   "Baseline-first path: upload the Azure extractor ZIP on the next step, then confirm system identity and brief."
Change: "Baseline-first path: upload a cloud inventory ZIP on the next step, then confirm system identity and brief."
```

**TB-487 — Demo source description:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepEvidenceUpload.tsx
Find:   "Choose a bundled synthetic Azure extractor package — no PowerShell script required. Demo outputs are labeled Simulator."
Change: "Choose a bundled example review scenario — no scripts or uploads required. Demo outputs are labeled Simulator."
```

**TB-491 — Remove "Tier-1" from wizard description:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepEvidenceUpload.tsx
Find:   "a Tier-1 cloud inventory ZIP (Azure, AWS, or GCP)"
Change: "a cloud inventory ZIP (Azure, AWS, or GCP)"
```

**TB-488 — AzureExtractorPackageZipField label:**
```
File: archlucid-ui/src/components/wizard/steps/AzureExtractorPackageZipField.tsx
Find (Label):  Azure packager ZIP
Change: Cloud inventory ZIP
Add JSDoc above function: "@important This component hardcodes cloudProvider='Azure' when applied — do not reuse for AWS/GCP evidence paths."
```

**TB-497 — Skip evidence context:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepEvidenceUpload.tsx
After the "Skip evidence for now" Button, add a helper <p> element:
"Skipping evidence is OK — you can add files or cloud inventory from the review detail page after the review is created. Findings without evidence may have lower confidence."
```

---

### Batch 3 — P1 onboarding (30 min)

**TB-483 + TB-493 — Core Pilot step 4:**
```
File: archlucid-ui/src/lib/core-pilot-steps.ts
Step index 3 (4th step):
  title: "Upload cloud inventory evidence"
  shortBody: "Attach a cloud inventory ZIP (Azure, AWS, or GCP) so cost findings and ROI cite measured spend — optional for document/brief-only reviews."
  detail: add "If you are using brief, document, or diagram evidence only, skip this step — findings will still run and may have lower confidence on cost claims."
```

**TB-485 — WizardStepAzureContext collapsible:**
```
File: archlucid-ui/src/components/wizard/steps/WizardStepAzureContext.tsx
Trigger label: "Add Azure inventory ZIP" → "Add cloud inventory ZIP"
Inner description: replace ARM/ResourceGroupScope text with "Run the read-only inventory script for your cloud provider locally, then attach the ZIP to prefill wizard fields."
Replace AzureExtractorQuickStartCommandPanel with CloudInventoryExtractorCommandPanel platform="azure"
```

**TB-486 — WizardStepIdentity footer (see Batch 1)**

---

### Batch 4 — P1 checklist and provenance (30 min)

**TB-489 — Evidence checklist row:**
```
File: archlucid-ui/src/components/usability/InProductEvidenceChecklist.tsx
Find:   label: "API reachable (/health/ready)"
Change: label: "Service connectivity"
```

**TB-490 — Tier1InventoryZipUploadPanel hint:**
```
File: archlucid-ui/src/components/wizard/Tier1InventoryZipUploadPanel.tsx
Find:   "Client-side checks require <code>manifest.json</code> (schemaVersion 1) and <code>resources.json</code> at the archive root. Maximum size {maxMb} MB."
Change: "Drop the inventory ZIP output from the extractor script. Maximum size {maxMb} MB. The file is validated locally before upload."
```

**TB-492 — FindingTrustChip label:**
```
File: archlucid-ui/src/components/findings/FindingTrustChip.tsx
Find:   kind: "citation-missing", label: "Citation missing", title: "No evidence references are attached to this finding."
Change: kind: "citation-missing", label: "No evidence linked", title: "No evidence references are attached to this finding. Add evidence to the review or re-run to improve traceability."
```

**TB-499 — Evidence checklist walkthrough link:**
```
File: archlucid-ui/src/components/usability/InProductEvidenceChecklist.tsx
Find:   Full walkthrough
Change: Open setup guide
```

---

### Batch 5 — P2 code hygiene (1–2 hours, non-urgent)

- TB-494: JSDoc note on `AzureExtractorZipDropZone.tsx`
- TB-495: Migrate `WizardStepAzureContext` + `AzureExtractorPackageZipField` to `CloudInventoryExtractorCommandPanel`; deprecate legacy
- TB-496: Export `buildReadinessCloudEvidenceSummary` alias; deprecate old name
- TB-498: Export `READINESS_CLOUD_EVIDENCE_LABEL` alias; deprecate old const name
- TB-500: Add `DemoReviewScenarioId` / `DEFAULT_DEMO_REVIEW_SCENARIO_ID` aliases; deprecate originals

---

## Conflict check with prior session backlog items

| New finding | Nearest prior TB | Assessment |
| --- | --- | --- |
| E01 (AWS/GCP labels) | TB-466 (rename "Connect Azure" CTA) | Complementary — TB-466 is nav-level; E01 is wizard identity step |
| E02 (Azure default) | TB-465 (remove Azure import from hero lead) | Complementary — different surfaces |
| E03–E04 (step 4, baseline notice) | None | New surface |
| E05 (collapsible label) | TB-485 (this item) | New |
| E06 (footer hint) | TB-466 | Complementary |
| E07 (demo description) | TB-480 (demo-harness copy) | Complementary — TB-480 addresses demo latency string; E07 is wizard demo source description |
| E08 (label + cloudProvider) | None | New |
| E09–E13 (provenance, checklist) | None | New surfaces |
| E14–E20 (code hygiene) | None | New |

**No contradictions found.** All findings are complementary to or on different surfaces from existing TB-431–480 and N01–N19.
