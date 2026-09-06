<!-- Insight-density excellence Composer prompts — paste one DX section per session.
     Origin: 2026-09-06 owner ask: Cursor-implementable batches from
     docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md
     Do not implement from this index. -->

# Insight-density excellence — Composer prompt set (DX-01–DX-16)

Canonical prompts (copy-paste blocks): [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)

Strategy (why): [`docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](../../docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)

**Do not implement from this index.** Open the architecture file and paste **one** `DX-nn` prompt into a fresh Composer / Cloud Agent chat.

**Do not re-run** ID-01–ID-10, PP-01 (map already shipped), WK-08 (expand via DX-03).

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

DX-17–DX-20 (Graph-RAG, TB-885, verification loop, live frontier capture) are listed at the bottom of the architecture file — start only after DX-01–DX-10.

## Constraints (same as architecture file)

- One prompt per chat. Feature branch per prompt. Do not push `master`.
- Path/contradiction engines DX-06–DX-09 are authorized; coverage-only “node missing” engines are not.
- No 5th `AgentType` enum (DX-10 uses the orchestrator/judge seam).
- No fake named-model frontier transcripts.
