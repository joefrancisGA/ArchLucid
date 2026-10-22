<!-- Insight-density excellence Composer prompts — paste one DX section per session.
     Origin: 2026-09-06 owner ask: Cursor-implementable batches from
     docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md
     Do not implement from this index. -->

# Insight-density excellence — Composer prompt set (DX-01–DX-76)

Canonical prompts (copy-paste blocks):

- **DX-01–DX-16 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- **DX-17–DX-28 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-18** and **DX-19** shipped 2026-09-07)
- **DX-29–DX-35 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- **DX-36–DX-41 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- **DX-42–DX-46 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- **DX-47–DX-50 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md)
- **DX-51–DX-56 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md)
- **DX-57 (shipped `#2242` — do not re-run):** Real-mode ranking-prior defaults; no prompt file
- **DX-58–DX-62 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md)
- **DX-63–DX-68 (shipped — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md)
- **DX-69–DX-72 (shipped `#2447` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md)
- **DX-73–DX-76 (ready):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md)

Strategy (why): [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)

**Do not implement from this index.** Open the architecture file and paste **one** `DX-nn` prompt into a fresh Composer / Cloud Agent chat.

**Do not re-run** ID-01–ID-10, PP-01 (map already shipped), WK-08, **DX-01–DX-16**.

## Sequence (run in order unless marked parallel)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-01** | Gate predicate + resolvable evidence | First | none |
| **DX-02** | Real-mode LLM judge on | After DX-01 | DX-01 |
| **DX-03** | Declaration actor / trust-boundary expansion | Yes with DX-01 | none |
| **DX-04** | Declaration vs inventory contradiction | After DX-01 | DX-01 |
| **DX-05** | Open-commitment × current topology | After DX-01 | DX-01 |
| **DX-06** | Identity blast-radius | After DX-03 | DX-03 |
| **DX-07** | Segmentation semantics | After DX-03 | DX-03 |
| **DX-08** | DR / RPO vs replica | After DX-01 | DX-01 |
| **DX-09** | Secrets lifecycle | After DX-01 | DX-01 |
| **DX-10** | InsightGenerator (no new `AgentType`) | After DX-01+02 | DX-01, DX-02 |
| **DX-11** | Portfolio recurrence default on | Yes | none |
| **DX-12** | ITSM export decision-grade only | After DX-01 | DX-01 |
| **DX-13** | “I did not think of that” signal | Yes | none |
| **DX-14** | Golden harness expansion | After DX-04 | DX-04 |
| **DX-15** | Measurement floor skipped engines | After DX-03 | DX-03 |
| **DX-16** | Starter catalog mapped P0 ids | Yes | none |

**DX-01–DX-16 are on `master` — do not re-run.**

**DX-17–DX-28 shipped** (2026-09-07), including **DX-18** (TB-885) and **DX-19** (TB-2033). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-21** | Judge cap engine-type priority | Yes | DX-02 shipped |
| **DX-22** | Checklist-cluster synthesis | Yes | DX-01 shipped |
| **DX-23** | Novelty rate by engine | Yes | DX-13 shipped |
| **DX-24** | Dangling declaration refs | Yes | none |
| **DX-25** | Requirement × SKU/tier | Yes | DX-08 shipped |
| **DX-26** | Path counterfactual line | Yes | DX-06 shipped |
| **DX-27** | Nested ARM / Bicep module / TF for_each ingest | Yes | none |
| **DX-28** | Path-engine golden fixtures | Yes | DX-14 shipped |
| **DX-17** | Community summaries → InsightGenerator | After DX-21–28 | DX-10 shipped |
| **DX-20** | Frontier capture schema | After DX-21–28 | DX-13 preferred |
| **DX-18** | TB-885 compounding ledger | **Shipped** (2026-09-07) | — |
| **DX-19** | ADR 0062 verification slice 1 | **Shipped** (2026-09-07) | TB-2033 / ADR 0062 |

**DX-29–DX-35 shipped** (2026-09-07). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-29** | Golden fixture depth | Yes | DX-24, DX-25, DX-28 shipped |
| **DX-30** | Helm / Kustomize / `.bicepparam` ingest | Yes | none |
| **DX-31** | TF modules / OIDC / Front Door / private DNS ingest | Yes | none |
| **DX-32** | Data-flow vs trust-boundary path | Yes | DX-03, DX-06 shipped |
| **DX-33** | Three-way pack × declaration × inventory | Yes | DX-04 shipped |
| **DX-34** | Preferred-engine list catch-up | Yes | DX-21 shipped |
| **DX-35** | Novelty-rate judge-cap sort (default off) | After DX-34 | DX-21, DX-23 shipped |

**DX-36–DX-41 shipped** (2026-09-07). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-36** | Golden harness: data-flow + three-way contradiction | Yes | DX-32, DX-33 shipped |
| **DX-37** | ARM `templateLink` in-batch resolution | Yes | DX-27 shipped |
| **DX-38** | Novelty rates into InsightGenerator (default off) | Yes | DX-10, DX-23, DX-35 shipped |
| **DX-39** | Policy maps on graph + inventory security engines | Yes | PP-01 / DX-33 shipped |
| **DX-40** | Inventory-shaped golden fixtures | After DX-36 preferred | DX-14 shipped |
| **DX-41** | Measurement-copy honesty | Yes | none |

**DX-42–DX-46 shipped** (2026-09-07). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-42** | Pulumi stack export + CloudFormation / CDK synth ingest | Yes | DX-30, DX-37 shipped |
| **DX-43** | Three-way contradiction across all five policy themes | Yes | DX-33 shipped |
| **DX-44** | AWS/GCP inventory golden fixtures | Yes | DX-40 shipped |
| **DX-45** | Honest EvidenceRefs on ARM/ARN/policy engines | Yes | none |
| **DX-46** | Advisor + AWS/GCP cost-recommendation goldens | After DX-44 preferred | DX-40 shipped |

**DX-47–DX-50 shipped** (2026-09-07). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-47** | Honest EvidenceRefs remainder (cost + path engines) | Yes | DX-45 shipped |
| **DX-48** | Golden fixtures proving DX-42 ingest feeds density engines | Yes | DX-42 shipped |
| **DX-49** | Golden harness for two absent engines + topology-anti-pattern golden | After DX-48 preferred | engines shipped |
| **DX-50** | Tighten HasConcreteEvidenceCitation (Workstream 2) | After DX-47 | DX-47 shipped |

**DX-51–DX-56 shipped** (2026-09-08). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-51** | Decision-grade finding fusion (post-gate join) | First | DX-22, DX-50 shipped |
| **DX-52** | Held-check ledger (missing-input attribution) | Yes with DX-51 | DX-15 shipped |
| **DX-53** | Portfolio shared-topology join | After DX-51 preferred | DX-11 shipped |
| **DX-54** | Frontier-baseline harness (instrument only) | Yes with DX-51 | DX-20 shipped |
| **DX-55** | Prose assumption extraction | After DX-51; owner-gated | DX-10, DX-51 shipped |
| **DX-56** | Verification-calibrated engine priors | After TB-2034 volume; owner-gated | TB-2034, DX-23 |

**DX-57 shipped** (`#2242`, 2026-09-08). Real-mode effective-on for `PreferHighNoveltyEngines` / `PreferHighVerificationEngines`; tenant opt-out for those plus `EnableInsightGenerator`. Not a prompt file — do not re-run.

**DX-58–DX-62 shipped** (2026-09-08). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-58** | Gate penalty telemetry on the distribution report | First | DX-50 shipped |
| **DX-59** | Raise `DemotionThreshold` to 65 | After DX-58; owner-gated | DX-58 |
| **DX-60** | Held-check second pass after inventory upload | Yes with DX-58 | DX-52 shipped |
| **DX-61** | Prose assumption register | Yes with DX-58 | DX-55 shipped |
| **DX-62** | Judge remaining-budget cap shrink | Yes with DX-58 | DX-02, DX-57 |

**DX-63–DX-68 shipped** (2026-09-08). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-63** | Cross-engine corroboration scoring | First | DX-51, DX-59 shipped |
| **DX-64** | Topology security drift vs prior graph | Yes with DX-63 | Prior graph load already ships |
| **DX-65** | Path-engine impact witness on the gate | After DX-63 | DX-63, DX-26 shipped |
| **DX-66** | `NotVerifiable` assumptions as held-check asks | Yes with DX-63 | DX-61, DX-52 shipped |
| **DX-67** | Gate vs human novelty calibration | Yes with DX-63 | DX-13, DX-23, DX-58 shipped |
| **DX-68** | IE-12 exception expiry into `open-commitment` | Yes with DX-63 | DX-05 shipped |

Owner-gated (not default-on in DX-63–DX-68): live frontier corpus (**G-REAL-06**), `EnableProseAssumptionExtraction` default-on, Graph-RAG live ablation (**TB-883**), `PreferHighHumanAcceptResidual` (DX-67 flag, default false).

**DX-69–DX-72 shipped** (`#2447`, 2026-09-09). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-69** | Declaration-derived IAM + data-flow path edges | First | DX-03, DX-06, DX-32 shipped |
| **DX-70** | Tighten remaining evidence-ref vetoes | Yes with DX-69 | DX-50 shipped |
| **DX-71** | Fuse-then-demote constituents | Yes with DX-69 | DX-51, DX-63 shipped |
| **DX-72** | Graduated evidence-quality score terms | After DX-70 | DX-70, DX-65 shipped |

**DX-73–DX-76 ready** (2026-09-09). Canonical prompts: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md)

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **DX-73** | Re-record engine distribution after DX-69–DX-72 | First | DX-69–DX-72 shipped |
| **DX-74** | AWS/GCP declaration IAM path edges | After DX-73 starts | DX-69 shipped |
| **DX-75** | Data-flow `CONNECTS_TO` golden without overlay | Yes with DX-74 | DX-69 shipped |
| **DX-76** | NSG/SG/firewall rule promotion + association edges | Yes with DX-74 | DX-07, DX-69 shipped |

Owner-gated (not in DX-73–DX-76): live extractor-as-default, `EnableProseAssumptionExtraction` default-on, live frontier corpus (**G-REAL-06**), Graph-RAG live ablation (**TB-883**).

## Constraints (same as architecture file)

- One prompt per chat. Feature branch per prompt. Do not push `master`.
- Path/contradiction engines DX-06–DX-09, DX-22 / DX-24 / DX-25, and follow-on **DX-32** / **DX-33** are authorized; coverage-only “node missing” engines are not. **DX-36–DX-50 add no new EngineType.** **DX-51** / **DX-53** add synthesis/contradiction engines only. **DX-64** adds `topology-security-drift` only.
- **DX-47–DX-50 shipped** — do not re-run.
- **DX-51–DX-56 shipped** — do not re-run.
- **DX-57 shipped** (`#2242`) — do not re-run.
- **DX-58–DX-62 shipped** — do not re-run.
- **DX-63–DX-68 shipped** — do not re-run.
- **DX-69–DX-72 shipped** — do not re-run.
- **DX-73–DX-76** — run from [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md); one prompt per chat. **Adds no EngineType.**
- No 5th `AgentType` enum (DX-10 uses the orchestrator/judge seam).
- No fake named-model frontier transcripts.
- **DX-19** (ADR 0062 / TB-2033) shipped 2026-09-07 — do not re-run.
