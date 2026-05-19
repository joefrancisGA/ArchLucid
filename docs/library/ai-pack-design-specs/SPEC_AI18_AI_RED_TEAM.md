> **Scope:** Design spec for AI policy pack **AI-18 — AI Red-Team & Safety Assurance Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for AI red-team programme posture — not safety certification, red-team results attestation, or guarantee of safe AI behaviour.

# AI-18 — AI Red-Team & Safety Assurance Architecture — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of an **AI red-team and safety assurance programme** — red-team programme design, attack-library version governance, safety-eval pipeline integration, jailbreak-resistance gating, dual-use review board, and pre/post-deployment red-team cadence. This complements MITRE ATLAS (AI-14, defensive architecture) and LLM Observability (AI-10, eval architecture). It specifically covers the organisational and pipeline architecture of the *red-team function itself* — not the execution of red-team exercises.

**Buyer outcome:** An enterprise developing or deploying high-stakes AI can assign this pack and see whether their AI red-team programme has the architecture foundation needed — red-team scope documentation, attack library governance, safety eval integration into deployment pipeline, and findings remediation tracking.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: Microsoft AI Red Team practices and published red-team reports; NIST AI 600-1 §Govern 4.3 (AI red-teaming); HELM-Safety (Stanford); OpenAI red-team framework public guidance; Google DeepMind red-team methodology. | Multi-source. |
| A2 | **AI red-team** = structured adversarial testing of AI systems by a team with explicit goals to find failures before deployment. Distinct from vulnerability scanning (automated) and penetration testing (infrastructure). | Definition. |
| A3 | Architecture evidence for red-team programme: red-team scope document (in `governance.PolicyConstraints`), attack library version reference (in `services[]` tags for the red-team tooling service), safety eval integration into CI/CD pipeline (in `relationships[]`), findings remediation SLA (in `governance.RequiredControls`). | Evidence-mappability. |
| A4 | **Dual-use review board** = a governance body that evaluates AI capabilities that could be misused (CBRN information generation, deepfake production, autonomous attack tooling). Architecture evidence: board existence documented in governance metadata. | NIST AI 600-1 reference. |
| A5 | AI-10 (LLM Observability) covers eval harness and golden-set governance. AI-18 covers the red-team programme that feeds findings *into* the eval and safety pipeline. | Non-overlapping. |
| A6 | AI-14 (MITRE ATLAS) covers defensive architecture against specific ML attacks. AI-18 covers the red-team function that executes adversarial testing and feeds findings back to defensive posture. | Complementary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `ai-rt-` is distinct. | Verified. |
| C2 | Rules must not provide red-team attack execution instructions. | Safety concern — same as ATLAS pack. |
| C3 | Pack must not imply that having a red-team programme certifies safe AI behaviour. | Mandatory disclaimer. |
| C4 | Jailbreak-resistance gating rules must be phrased as architecture posture ("is jailbreak resistance testing integrated into the deployment pipeline?") not attack techniques. | Scope boundary. |

---

## 4. Architecture Overview

```
Microsoft AI Red Team practices + NIST AI 600-1 §Govern 4.3 + HELM-Safety
        ↓
LLM generator (programme design → attack library → safety eval → dual-use → cadence sub-corpora)
        ↓
Critic (attack-instruction check, methodology citation accuracy)
        ↓
Human SME (dual-use content review)
        ↓
ai-red-team-safety-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-red-team-safety` |
| Display name | **AI Red-Team & Safety Assurance Architecture** |
| Short name | `AI Red Team` |
| Category | **Security** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Microsoft AI Red Team practices; NIST AI 600-1 §Govern 4.3 (2024); HELM-Safety (Stanford, 2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `ai-rt-prog-` | Programme design (red-team scope, charter, independence, resourcing) | 5 | P0-heavy |
| `ai-rt-atk-lib-` | Attack library governance (attack scenario library versioned, coverage mapped, update cadence) | 4 | P0/P1 |
| `ai-rt-safety-eval-` | Safety eval pipeline integration (jailbreak resistance testing in CI, harmful-output eval gating) | 5 | P0-heavy |
| `ai-rt-dual-use-` | Dual-use review architecture (dual-use board existence, review trigger design, escalation path) | 4 | P0/P1 |
| `ai-rt-cadence-` | Red-team cadence and findings remediation (pre-deployment, post-deployment, cadence SLA, remediation tracking) | 5 | P0/P1 |
| `ai-rt-incident-` | AI safety incident response (safety incident classification, response playbook design, disclosure policy architecture) | 4 | P1/P2 |
| **Total** | | **~27 rules** | |

### 5.3 Key evidence fields

`governance.PolicyConstraints` (red-team programme charter, dual-use review policy, safety incident policy), `governance.RequiredControls` (jailbreak resistance gating requirement, remediation SLA), `services[].Tags` (red-team tooling service, attack library version, safety eval service), `relationships[].relationshipType` (safety eval pipeline → deployment gate), `metadata.DecisionTraceIds` (red-team finding → remediation decision audit).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces programme design, safety eval pipeline integration, and dual-use review architecture. Cadence and incident response rules surface at P0/P1; incident response at P1/P2.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules containing attack execution guidance | Human SME mandatory review of all `ai-rt-atk-lib-*` and `ai-rt-safety-eval-*` rules for attack technique specificity. Critic checklist checks for imperative attack language. |
| Dual-use review rules touching CBRN | Dual-use rules reference capability category (CBRN, deepfake, autonomous attack) not specific model output or attack technique. |
| Buyers treating pack output as safety certification | Disclaimer: "Thematic architecture-review mapping; not safety certification or red-team results attestation." |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `mitre-atlas` (AI-14), `llm-observability-evals` (AI-10), `owasp-llm-top10` (AI-01), `agentic-ai-mcp` (AI-06). |
| Microsoft AI Red Team public disclosure | Microsoft has published red-team reports for Copilot, Bing, DALL-E; these can be referenced as example scope documentation. |

---

## 9. Acceptance criteria

1. ~27 rules; every sub-corpus represented.
2. No rule contains attack execution instructions.
3. `ai-rt-safety-eval-*` includes ≥ 2 P0 rules for safety eval pipeline integration.
4. `metadata.frameworkMappingDisclaimer` contains "not safety certification".
5. Dual-use rules reviewed and approved by human SME before publication.
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack certify that our AI is safe?**
A: No. Safety certification requires formal evaluation, testing, and often regulatory review. ArchLucid evaluates architecture-level posture — whether a red-team programme is designed, whether jailbreak resistance testing is built into the deployment pipeline, and whether dual-use governance structures are in place. Having good posture does not guarantee safe AI behaviour; it demonstrates intentional governance design.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI14_MITRE_ATLAS.md`](SPEC_AI14_MITRE_ATLAS.md) | Adversarial ML defensive posture |
| [`SPEC_AI10_LLM_OBSERVABILITY.md`](SPEC_AI10_LLM_OBSERVABILITY.md) | Eval pipeline complement |
