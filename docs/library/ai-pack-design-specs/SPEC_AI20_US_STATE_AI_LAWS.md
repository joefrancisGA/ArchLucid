> **Scope:** Design spec for AI policy pack **AI-20 — US State AI Laws: Colorado AI Act + NYC Local Law 144 + California AI Legislation**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping toward US state AI laws — not legal compliance determination, legal advice, or equivalence to a qualified legal opinion on state law applicability.

# AI-20 — US State AI Laws — design spec

---

## 1. Objective

Ship a pack covering the **architecture-review posture themes emerging from US state AI laws** — principally Colorado SB 24-205 (AI Act, May 2024), New York City Local Law 144 (automated employment decision tools, effective 2023), California AB 302 and the California Consumer Privacy Act AI provisions, and Texas SB 2037 (Texas Responsible AI Governance Act, 2025). These laws target algorithmic decision-making for consequential decisions (employment, credit, housing, healthcare, tenant screening) and impose requirements for impact assessments, bias audits, transparency notices, and opt-out rights.

**Buyer outcome:** An enterprise operating in jurisdictions covered by these laws, or a software vendor whose customers operate in these jurisdictions, can assign this pack and see which architecture-evidence posture exists for state AI law requirements — bias audit architecture, transparency notice design, opt-out mechanism, and impact assessment documentation.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Primary sources: Colorado SB 24-205 (effective 2026-02-01), NYC Local Law 144 (effective 2023, bias audit requirement), California AB 302 (AI in state services, 2023), Texas SB 2037 (Texas RAGA, 2025 — if enacted). | State legislative sources. |
| A2 | These laws share common themes: **high-risk AI** (consequential decisions), **bias audit**, **transparency notice**, **opt-out or appeal mechanism**, **impact assessment**. Rules are organised by these themes rather than law-by-law to avoid rapid obsolescence. | Thematic stability. |
| A3 | Architecture evidence: bias audit service documented in `services[]`; impact assessment referenced in `governance.PolicyConstraints`; transparency notice mechanism in `governance.RequiredControls`; opt-out mechanism in `services[]` or `relationships[]`. | Manifest schema. |
| A4 | Pack does **not** determine whether the customer's jurisdiction is covered by these laws — that is a legal determination. Rules use conditional framing. | Auto-classification prohibition. |
| A5 | OMB M-24-10 (AI-13) covers federal rights-impacting AI requirements. This pack covers state-specific laws with different scope thresholds and mechanisms. | Adjacent pack boundary. |
| A6 | Laws are rapidly evolving — multiple states have passed or are considering AI legislation in 2025–2026. Pack is designed for thematic stability; specific law citations are versioned in `sourceCitation`. | Regulatory volatility management. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `us-state-ai-` is distinct. | Verified. |
| C2 | State law text is public domain in the US; citations are unrestricted. | No copyright concern. |
| C3 | Pack must not provide legal advice on state law applicability. | Mandatory disclaimer. |
| C4 | Rules must be themed (bias audit, transparency, opt-out) not jurisdiction-specific wherever possible, to ensure longevity across the rapid legislative landscape. | Design for durability. |
| C5 | No `Critical` severity — state law applicability is a legal judgment. | Common design decision. |

---

## 4. Architecture Overview

```
Colorado SB 24-205 + NYC LL 144 + CA AB 302 + Texas SB 2037 + NIST AI RMF (bias)
        ↓
LLM generator (high-risk AI → bias audit → transparency → opt-out → impact assessment sub-corpora)
        ↓
Critic (law citation accuracy, conditional framing check, disclaimer presence)
        ↓
Human SME (legal boundary calibration)
        ↓
us-state-ai-laws-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `us-state-ai-laws` |
| Display name | **US State AI Laws — Architecture Themes (Colorado, NYC, California, Texas)** |
| Short name | `State AI Laws` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Colorado SB 24-205 (May 2024); NYC Local Law 144 (2021, effective 2023); California AB 302 (2023); Texas SB 2037 (2025)" |

### 5.2 Sub-corpora (themed, not law-specific)

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `us-state-ai-scope-` | High-risk AI consequential decision scope (employment, credit, housing, healthcare, tenant screening identification) | 4 | P0-heavy |
| `us-state-ai-audit-` | Bias audit architecture (bias audit service design, annual cadence, third-party audit documentation) | 5 | P0-heavy |
| `us-state-ai-notice-` | Transparency and notice design (disclosure notice mechanism, AI-interaction notice, purpose disclosure) | 4 | P0/P1 |
| `us-state-ai-optout-` | Opt-out and appeal mechanism design (opt-out pipeline, human review appeal path, outcome explanation) | 5 | P0/P1 |
| `us-state-ai-impact-` | Impact assessment documentation (bias impact assessment, disparate impact analysis, documentation architecture) | 4 | P1 |
| **Total** | | **~22 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (consequential decision marker, bias audit integration marker, transparency notice enabled), `services[].Purpose` (employment decision, credit decision, tenant screening, etc.), `governance.PolicyConstraints` (bias audit policy, transparency notice policy, opt-out policy), `governance.RequiredControls` (human review requirement, appeal mechanism, annual audit cadence), `metadata.DecisionTraceIds` (bias audit decision trace, impact assessment reference).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces consequential decision scope identification and bias audit architecture. Transparency notice and opt-out rules surface at P0/P1; impact assessment at P1.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Auto-classification of AI system under state law | All scope rules: "if this system makes or substantially assists in consequential decisions covered by applicable state law…". |
| Buyers treating pack output as legal compliance determination | Disclaimer: "Thematic architecture-review mapping; not legal compliance determination, legal advice, or legal opinion on state law applicability." |
| Rapidly changing legislative landscape | Pack description notes "V1 covers Colorado SB 24-205, NYC LL 144, CA AB 302, Texas SB 2037"; rules are themable across laws; annual pack update tracks legislative evolution. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `ai-public-sector-us` (AI-13), `ai-governance-responsible-ai` (#1), `gdpr-baseline` (#5). |
| Regulatory volatility | ~15 states have introduced or passed AI legislation in 2024–2026. Pack version strategy: minor bump for new state coverage; major bump for incompatible thematic changes. |
| GTM framing | Pack description should note the rapidly evolving landscape and direct buyers to qualified legal counsel for applicability determination. |
| Procurement answer | "ArchLucid maps architecture evidence against US state AI law themes — bias audit design, transparency notices, opt-out mechanisms. It does not provide legal advice on state law applicability." |

---

## 9. Acceptance criteria

1. ~22 rules; every sub-corpus represented.
2. All consequential-decision scope rules use conditional framing.
3. `metadata.frameworkMappingDisclaimer` contains "not legal compliance determination" and "not legal advice".
4. `us-state-ai-audit-*` includes ≥ 2 P0 rules for bias audit architecture.
5. Pack description includes "rapidly evolving — see qualified legal counsel" advisory.
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack determine whether our AI system must comply with the Colorado AI Act or NYC Local Law 144?**
A: No. Whether your AI system falls within the scope of these laws is a legal determination based on your deployment context, the decisions your system makes, and the jurisdictions of your users. ArchLucid maps architecture evidence against the common requirements these laws impose — bias audits, transparency notices, opt-out mechanisms — to help your team prepare if your legal counsel determines coverage applies.

**Q: The state AI law landscape changes frequently. How is this pack kept current?**
A: The pack is organised thematically (bias audit, transparency, opt-out) rather than law-by-law, to maximise durability. When significant new state laws are enacted or major laws are amended, a minor version bump adds coverage. The `sourceCitation` field is updated and the changelog documents new laws covered.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI13_AI_PUBLIC_SECTOR.md`](SPEC_AI13_AI_PUBLIC_SECTOR.md) | Federal AI requirements (OMB M-24-10) |
| [`SPEC_AI04_EU_AI_ACT.md`](SPEC_AI04_EU_AI_ACT.md) | EU AI Act counterpart |
