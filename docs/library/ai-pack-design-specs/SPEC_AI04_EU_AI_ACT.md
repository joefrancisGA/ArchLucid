> **Scope:** Design spec for AI policy pack **AI-04 — EU AI Act High-Risk AI Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping toward EU AI Act Regulation (EU) 2024/1689 — not legal classification, conformity assessment, notified body certification, or CE marking authority.

> **Spine docs:** [`README.md`](README.md) · [`../POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md)

# AI-04 — EU AI Act — High-Risk AI Architecture — design spec

---

## 1. Objective

Ship a dedicated **EU AI Act high-risk AI** pack covering Articles 6–16 obligations for providers and deployers of high-risk AI systems. Pack #1 (`ai-governance-responsible-ai`) references EU AI Act Annex III themes; this pack provides **Article-level depth** for buyers who face the August 2026 high-risk AI obligations or whose procurement questionnaires cite specific EU AI Act articles.

**Buyer outcome:** A buyer subject to the EU AI Act (provider placing a high-risk AI system on the EU market, or deployer using one) can assign this pack and see, from an ArchLucid run, which Article obligations have architecture-evidence support and where gaps require legal / technical remediation before an Article 43 conformity assessment.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative source: **Regulation (EU) 2024/1689** (EU AI Act, published 2024-07-12). High-risk AI obligations apply from August 2, 2026. | Official EU Journal. |
| A2 | Architecture-evidence scope covers Articles 9–16 (provider obligations) and Article 26 (deployer obligations). Articles 3 (definitions), 17 (quality management narrative), and Annex I/IV are reference only. | Evidence-mappability. |
| A3 | Pack does **not** classify the customer's AI system as high-risk — that determination rests with the customer's legal counsel against Annex II and Annex III. Rules are scoped: "if your system is high-risk, does your architecture evidence X?" | Critical legal boundary. |
| A4 | Priority mapping: Article 9 (risk management system) and Article 10 (data and data governance) → P0; Articles 11–13 (technical documentation, transparency, human oversight) → P0/P1; Article 14 (human oversight specifics) and Article 15 (accuracy/robustness) → P1; Article 16/26 deployer and post-market → P2. | EU AI Act obligation timeline. |
| A5 | Annex III lists the 8 high-risk categories; rules reference category themes (education, employment, essential services, law enforcement, etc.) to help buyers self-identify relevance — with mandatory disclaimer. | Buyer discoverability. |
| A6 | Pack #1 EU AI Act coverage is Annex III thematic only (3–4 rules). This pack adds ~45 rules of Article-level depth. | Distinct coverage. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | EU AI Act text is EU law — not reproduced verbatim. Articles cited by number + brief intent. | Legal copyright caution. |
| C2 | Pack must never state or imply that ArchLucid's findings constitute a conformity assessment or substitute for Article 43 procedures. | Legal boundary — mandatory on every rule. |
| C3 | "High-risk AI" classification is a legal determination — rules must use conditional framing: "if the system is deployed as high-risk under Annex III…". | Auto-classification prohibition. |
| C4 | Rule prefix `eu-ai-act-` must not conflict. | Verified distinct. |
| C5 | FRIA (Fundamental Rights Impact Assessment, Article 27) is deployer-only and document-centric — 2 P2 rules maximum. | Scope boundary. |

---

## 4. Architecture Overview

```
EU AI Act 2024/1689 — Articles 9–16, 26 + Annex III
        ↓
LLM generator (article-by-article sub-corpora)
        ↓
Critic (Article number accuracy, conditional framing check, disclaimer presence)
        ↓
Human SME (legal-boundary calibration, severity conservatism)
        ↓
eu-ai-act-high-risk-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `eu-ai-act-high-risk` |
| Display name | **EU AI Act — High-Risk AI Architecture Themes** |
| Short name | `EU AI Act` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Regulation (EU) 2024/1689 of the European Parliament and of the Council (EU AI Act), 2024-07-12" |

### 5.2 Sub-corpora

| Prefix | Article | Theme | Target rules | Priority |
|--------|---------|-------|-------------|---------|
| `eu-ai-act-art9-` | Art. 9 | Risk management system | 5 | All P0 |
| `eu-ai-act-art10-` | Art. 10 | Data and data governance | 6 | P0-heavy |
| `eu-ai-act-art11-` | Art. 11 | Technical documentation | 5 | P0/P1 |
| `eu-ai-act-art12-` | Art. 12 | Record-keeping and logging | 4 | P0/P1 |
| `eu-ai-act-art13-` | Art. 13 | Transparency (information to deployers) | 4 | P1 |
| `eu-ai-act-art14-` | Art. 14 | Human oversight | 5 | P0/P1 |
| `eu-ai-act-art15-` | Art. 15 | Accuracy, robustness, cybersecurity | 5 | P1 |
| `eu-ai-act-art26-` | Art. 26 | Deployer obligations | 4 | P1/P2 |
| `eu-ai-act-annex3-` | Annex III | High-risk category self-identification prompts | 5 | P1/P2 |
| `eu-ai-act-fria-` | Art. 27 | Fundamental Rights Impact Assessment themes | 3 | All P2 |
| **Total** | | | **~46 rules** | |

### 5.3 Key evidence fields

`governance.PolicyConstraints` (risk management system documentation), `governance.ComplianceTags` (high-risk category marker), `metadata.ChangeDescription` (technical documentation reference), `services[].Tags` (accuracy / robustness markers), `governance.RequiredControls` (human oversight mechanisms), `metadata.DecisionTraceIds` (decision audit for Art. 12 logging), `datastores[].Tags` (data governance for Art. 10).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces Art. 9 (risk management) and Art. 10 (data governance) must-haves on first use — the two most architecturally evidenced obligations. Deployer rules (Art. 26) and FRIA (P2) surface only when floor is widened.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Buyers treating output as Article 43 conformity assessment | Every rule: "Thematic architecture-review mapping; not EU AI Act conformity assessment, notified body certification, CE marking authority, or legal classification." Pack metadata repeats this. |
| Auto-classification of system as high-risk | Every rule conditionally framed: "If this system is deployed as high-risk under EU AI Act Annex III…". Pack name uses "Themes" suffix. |
| Buyers in non-EU jurisdictions misapplying | Annex III category rules include a P2 jurisdictional-applicability note. |
| Art. 10 data governance overlap with GDPR pack | Cross-reference `gdpr-baseline`; data governance rules are EU AI Act–specific (training data quality, bias, representativeness). |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1; CI count test updated. |
| Regulatory timeline | High-risk AI obligations apply August 2, 2026 (post-V1 launch). Pack is a pre-obligation readiness tool. |
| Adjacent packs | `ai-governance-responsible-ai` (#1), `iso-42001-aims` (AI-02), `gdpr-baseline` (#5), `nist-ai-600-1-genai` (AI-07). |
| Procurement answer | "ArchLucid maps architecture evidence against EU AI Act Article obligations. It does not perform conformity assessments, issue CE marking authority, or replace notified body procedures." |

---

## 9. Acceptance criteria

1. ~46 rules; every article sub-corpus represented.
2. All rules use conditional framing: "if the system is deployed as high-risk under Annex III".
3. `metadata.frameworkMappingDisclaimer` contains "not EU AI Act conformity assessment".
4. No auto-classification language in any rule.
5. All Annex III sub-corpus rules include a jurisdictional-applicability note.
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does ArchLucid determine whether my AI system is high-risk under the EU AI Act?**
A: No. That classification is a legal determination made by your counsel and compliance team against EU AI Act Annex II and Annex III. ArchLucid offers architecture-review evidence against the Article obligations that apply *if* your system is classified high-risk.

**Q: Can I use ArchLucid output as part of an Article 43 conformity assessment?**
A: ArchLucid findings can form part of the evidence package that an internal team or notified body reviews. They do not constitute the conformity assessment itself, which requires notified body involvement for certain Annex III categories.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | AI pack index |
| [`SPEC_AI02_ISO_42001.md`](SPEC_AI02_ISO_42001.md) | ISO 42001 AIMS (governance complement) |
| [`SPEC_AI07_NIST_AI_600_1.md`](SPEC_AI07_NIST_AI_600_1.md) | US GenAI regulatory complement |
| `docs/samples/policy-packs/gdpr-baseline-rules-v1.json` | EU regulatory pack format reference |
