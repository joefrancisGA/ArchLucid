> **Scope:** Design spec for AI policy pack **AI-14 — MITRE ATLAS: Adversarial ML Threat Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping toward MITRE ATLAS — not adversarial ML attack simulation, red-team execution, or MITRE endorsement.

# AI-14 — MITRE ATLAS: Adversarial ML Threat Architecture — design spec

---

## 1. Objective

Ship a pack covering **MITRE ATLAS** (Adversarial Threat Landscape for Artificial-Intelligence Systems) — the adversarial ML counterpart to MITRE ATT&CK. ATLAS documents tactics, techniques, and procedures (TTPs) targeting ML systems: model evasion, data poisoning, model extraction, model inversion, backdoor attacks, and supply-chain compromise. This pack translates ATLAS TTPs into architecture-posture questions — what defensive architecture evidence should exist for each adversarial ML threat category.

**Buyer outcome:** A security architect or AI red team can assign this pack and see which adversarial ML threat categories have architecture-evidence defensive posture and which are gaps requiring additional countermeasures.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative source: **MITRE ATLAS matrix v4+** (atlasai.mitre.org). | Official MITRE publication. |
| A2 | ATLAS tactics include: Reconnaissance, Resource Development, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Collection, ML Attack Staging, Exfiltration, Impact. | ATLAS v4 tactic list. |
| A3 | Architecture evidence covers **defensive architecture** for ATLAS attack categories — not simulation of the attacks themselves. | Scope boundary. |
| A4 | OWASP LLM Top 10 (AI-01) covers GenAI app-layer attack surfaces. ATLAS covers ML system attacks (model evasion, inversion, extraction, poisoning) — distinct surface. | Non-overlapping scope. |
| A5 | AI-18 (Red Team & Safety) covers the red-team *programme* architecture; ATLAS pack covers *defensive posture* against specific ML attack techniques. | Adjacent pack boundary. |
| A6 | Not all ATLAS techniques have architecture-level defensive evidence; rules are limited to techniques where manifest-level posture is meaningful (e.g. data access controls for poisoning, model isolation for extraction, monitoring for evasion). | Evidence-mappability constraint. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `atlas-` is distinct. | Verified. |
| C2 | Rules must not imply ArchLucid performs adversarial ML attacks or simulations. | Scope boundary. |
| C3 | MITRE ATLAS is a public resource; citation of tactic/technique IDs (e.g. AML.T0043) is unrestricted. | No copyright concern. |
| C4 | Rules covering model inversion and model extraction must be phrased as posture checks for defensive controls (API rate limiting documentation, output restriction policy) — not attack instructions. | Safety concern. |

---

## 4. Architecture Overview

```
MITRE ATLAS matrix v4 (tactics + techniques)
        ↓
LLM generator (per-tactic sub-corpora, defensive posture focus)
        ↓
Critic (ATLAS technique ID accuracy, defensive framing check)
        ↓
Human SME (attack-instruction avoidance review)
        ↓
mitre-atlas-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `mitre-atlas` |
| Display name | **MITRE ATLAS — Adversarial ML Threat Architecture** |
| Short name | `MITRE ATLAS` |
| Category | **Security** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "MITRE ATLAS: Adversarial Threat Landscape for Artificial-Intelligence Systems, v4+ (atlasai.mitre.org)" |

### 5.2 Sub-corpora (grouped by defensive architecture theme)

| Prefix | Defensive theme (ATLAS tactic area) | Target rules | Priority skew |
|--------|-------------------------------------|-------------|---------------|
| `atlas-poison-` | Data poisoning defences (training data access control, integrity verification, provenance) | 5 | P0-heavy |
| `atlas-evade-` | Evasion defences (input validation, adversarial input detection design, model ensemble documentation) | 5 | P1 |
| `atlas-extract-` | Model extraction defences (API rate limiting, output restriction policy, model access audit) | 5 | P0/P1 |
| `atlas-invert-` | Model inversion defences (output truncation, differential privacy documentation, output confidence policy) | 4 | P1 |
| `atlas-backdoor-` | Backdoor/trojan defences (training pipeline integrity, supply-chain model provenance) | 4 | P0/P1 |
| `atlas-supply-` | Supply-chain compromise defences (third-party model provenance, model integrity verification) | 4 | P0/P1 |
| `atlas-persist-` | Persistence defences (model monitoring for behavioral drift from baseline, anomaly detection design) | 3 | P1/P2 |
| **Total** | | **~30 rules** | |

### 5.3 Key evidence fields

`datastores[].Tags` (training data integrity controls, provenance markers), `services[].Tags` (output restriction policy, rate-limiting markers, ensemble marker), `governance.PolicyConstraints` (model output policy, API access policy), `governance.RequiredControls` (supply chain model provenance requirements), `metadata.ChangeDescription` (model update provenance evidence).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces data poisoning defences and model extraction defences. Evasion, inversion, and persistence rules surface at P1/P2.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules containing attack instructions | All rules framed as defensive posture questions. Critic checks for imperative attack language. Human SME mandatory review of any rule touching model inversion or backdoor techniques. |
| ATLAS technique IDs cited incorrectly | Critic checklist verifies AML.T* numbering pattern. |
| Overlap with OWASP LLM (AI-01) | Rules cross-reference OWASP LLM Top 10 for GenAI app-layer attacks; ATLAS rules cover ML-model-level attacks. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `owasp-llm-top10` (AI-01), `ai-red-team-safety` (AI-18), `ai-training-data-provenance` (AI-15), `supply-chain-sbom` (#20). |
| ATLAS matrix versioning | ATLAS v4+ is current; new techniques are added periodically. Pack is versioned and updated on major ATLAS releases. |
| Sensitive content review | All rules should be reviewed by human SME for adversarial technique specificity before publishing. |

---

## 9. Acceptance criteria

1. ~30 rules; every sub-corpus represented.
2. No rule contains imperative attack-instruction language.
3. All rules frame posture defensively.
4. `metadata.frameworkMappingDisclaimer` contains "not adversarial ML attack simulation".
5. Every `frameworkMappings` ATLAS entry cites a plausible AML.T* technique ID (Critic check).
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack perform adversarial ML attacks against our model?**
A: No. ArchLucid evaluates architecture-level defensive posture against MITRE ATLAS threat categories — whether training data provenance controls exist, whether model extraction defences are designed, and whether supply-chain model integrity is documented. Actual adversarial ML testing requires specialised red-team tooling and expertise — see the AI Red-Team & Safety pack.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI01_OWASP_LLM_TOP10.md`](SPEC_AI01_OWASP_LLM_TOP10.md) | OWASP GenAI app-layer attacks |
| [`SPEC_AI18_AI_RED_TEAM.md`](SPEC_AI18_AI_RED_TEAM.md) | Red-team programme architecture |
