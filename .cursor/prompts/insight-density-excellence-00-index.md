<!-- Insight-density excellence Composer prompts — paste one DX section per session.
     Origin: 2026-09-06 owner ask: Cursor-implementable batches from
     docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md
     Do not implement from this index. -->

# Insight-density excellence — Composer prompt set (DX-01–DX-28)

Canonical prompts (copy-paste blocks):

- **DX-01–DX-16 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- **DX-17–DX-28 (shipped on `master` — do not re-run):** [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-20** pending merge in PR #2002; **DX-18**/**DX-19** held)

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

**DX-01–DX-16 are on `master` — do not re-run.** **DX-17–DX-28 shipped** (2026-09-07) except **DX-18**/**DX-19** (held) and **DX-20** (PR #2002). Canonical history: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)

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
| **DX-18** | TB-885 compounding ledger | **Held** | Owner unparks TB-885 |
| **DX-19** | ADR 0062 verification slice 1 | **Held** | Owner unparks TB-2033 |

## Constraints (same as architecture file)

- One prompt per chat. Feature branch per prompt. Do not push `master`.
- Path/contradiction engines DX-06–DX-09 and follow-on DX-22 / DX-24 / DX-25 are authorized; coverage-only “node missing” engines are not.
- No 5th `AgentType` enum (DX-10 uses the orchestrator/judge seam).
- No fake named-model frontier transcripts.
- DX-18 (TB-885) and DX-19 (ADR 0062) stay held until the owner unparks those rows.
