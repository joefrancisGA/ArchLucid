> **Scope:** Design spec for AI policy pack **AI-15 — AI Training Data Governance & Provenance**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for training data governance posture — not legal clearance of dataset copyright, GDPR data subject rights compliance determination, or content authenticity certification.

# AI-15 — AI Training Data Governance & Provenance — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of **AI training data governance and provenance** — dataset cards, source lineage, opt-out and consent signal handling, copyright/license posture, deduplication, contamination testing, and C2PA-style content provenance. This is a forward-looking pack: training data governance is becoming a significant audit ask in 2026–2027, driven by EU AI Act Article 10 obligations, US copyright litigation (training on unlicensed content), and emerging content authenticity standards (C2PA). Pack #1 has 1 rule touching training data; this pack provides comprehensive coverage.

**Buyer outcome:** A team developing or fine-tuning AI models can assign this pack and see which training data governance architecture gaps exist — particularly dataset provenance documentation, consent and opt-out architecture, license classification, and contamination test design.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: EU AI Act Article 10 (training data governance for high-risk AI); C2PA Content Credentials specification (C2PA, 2024); "Datasheets for Datasets" (Gebru et al., 2021, widely cited); NIST AI 600-1 §GAI-3 (Data Privacy) and §GAI-4 (Data Poisoning). | Multi-source. |
| A2 | **Dataset card** = structured documentation of a dataset (intended use, source, composition, collection process, preprocessing, distribution, maintenance, legal considerations). Dataset card presence is an architecture artifact. | Datasheets for Datasets definition. |
| A3 | **Opt-out and consent signals** = mechanisms by which data subjects or content owners signal that their data should not be used for training (robots.txt AI crawling opt-out, C2PA do-not-train signal, GDPR Article 17 erasure-from-training). | Emerging standard. |
| A4 | **Contamination testing** = testing to ensure evaluation/test data is not present in training data, invalidating benchmark results. Architecture evidence: documented contamination test pipeline. | ML best practice. |
| A5 | Copyright / license posture = documentation of dataset source license classification (CC0, CC-BY, proprietary, scraped), legal review documentation. Architecture evidence: license field in dataset card / manifest. | Copyright risk. |
| A6 | Fine-tune training data for Azure OpenAI overlaps with `azure-openai-foundry` (AI-03) at the fine-tune storage level; this pack adds dataset lineage and consent signal architecture. | Non-duplicate. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `train-data-` is distinct. | Verified. |
| C2 | Pack must not provide legal clearance of dataset copyright or GDPR compliance determination. | Mandatory disclaimer. |
| C3 | C2PA content provenance is an emerging standard; rules reference C2PA capability categories rather than specific schema versions. | Spec stability. |
| C4 | Opt-out signal handling rules must be phrased as posture questions ("is an opt-out signal processing pipeline documented?") not policy mandates. | ArchLucid scope. |

---

## 4. Architecture Overview

```
EU AI Act Art. 10 + Datasheets for Datasets + C2PA + NIST AI 600-1 §GAI-3/4
        ↓
LLM generator (dataset card → lineage → consent → license → contamination → provenance sub-corpora)
        ↓
Critic (C2PA spec accuracy, EU AI Act article citation accuracy)
        ↓
Human SME (copyright scope calibration)
        ↓
ai-training-data-provenance-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-training-data-provenance` |
| Display name | **AI Training Data Governance & Provenance** |
| Short name | `Training Data` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "EU AI Act Art. 10 (2024); Gebru et al. 'Datasheets for Datasets' (2021); C2PA Content Credentials Specification (2024); NIST AI 600-1 §GAI-3/4 (2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `train-data-card-` | Dataset card governance (presence, required fields, update cadence on re-train) | 5 | P0-heavy |
| `train-data-lineage-` | Source lineage (data source documentation, transformation pipeline documentation, reproducibility) | 5 | P0/P1 |
| `train-data-consent-` | Consent and opt-out signals (opt-out pipeline documentation, GDPR erasure-from-training design) | 4 | P0/P1 |
| `train-data-license-` | Copyright and license posture (license classification per dataset, legal review documentation) | 4 | P0/P1 |
| `train-data-contam-` | Contamination testing (train/eval separation, contamination test pipeline documentation) | 4 | P0/P1 |
| `train-data-c2pa-` | C2PA content provenance (content credential attachment, do-not-train signal processing, provenance attestation) | 4 | P1/P2 |
| **Total** | | **~26 rules** | |

### 5.3 Key evidence fields

`datastores[].Tags` (dataset license, dataset card reference, opt-out signal status, contamination test status), `datastores[].DatastoreType` (training data store, evaluation data store), `metadata.ChangeDescription` (dataset version update justification), `governance.PolicyConstraints` (opt-out handling policy, license review policy), `governance.ComplianceTags` (GDPR training-data scope markers).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces dataset card governance, lineage, and contamination testing. C2PA provenance rules (P2) surface for advanced governance tenants.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Buyers treating pack output as copyright clearance | Disclaimer: "Thematic architecture-review mapping; not legal clearance of dataset copyright or GDPR compliance determination." |
| Opt-out rules creating data scraping guidance | Rules are posture questions about pipeline design, not scraping methodology instructions. |
| C2PA spec volatility | Rules reference C2PA capability categories (content credentials, do-not-train assertion) not specific schema version fields. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `ai-governance-responsible-ai` (#1), `eu-ai-act-high-risk` (AI-04), `gdpr-baseline` (#5), `supply-chain-sbom` (#20). |
| C2PA adoption timeline | C2PA do-not-train signal is adopted by major platforms; pack description notes the emerging status. |

---

## 9. Acceptance criteria

1. ~26 rules; every sub-corpus represented.
2. No rule provides copyright legal opinion.
3. `train-data-card-*` includes ≥ 2 P0 rules for dataset card presence and required fields.
4. `metadata.frameworkMappingDisclaimer` contains "not legal clearance of dataset copyright".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack determine whether our training data is legally cleared for use?**
A: No. Copyright clearance and GDPR compliance for training data require legal review by qualified counsel. ArchLucid evaluates architecture-level posture — whether dataset cards document source licenses, whether opt-out signal handling is architecturally designed, and whether contamination testing pipelines are present.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI03_AZURE_OPENAI_FOUNDRY.md`](SPEC_AI03_AZURE_OPENAI_FOUNDRY.md) | Fine-tune storage complement |
| [`SPEC_AI14_MITRE_ATLAS.md`](SPEC_AI14_MITRE_ATLAS.md) | Data poisoning defence complement |
