> **Scope:** ADR 0068 — Architecture synthesis and review evaluation are two kernels, not one pipeline with two labels.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0068: Architecture synthesis and review evaluation kernels (Option K)

- **Status:** Accepted
- **Date:** 2026-08-17
- **Deciders:** Owner
- **Related:** [ADR 0067](0067-create-architecture-and-review-co-equal-entry-points.md) (co-equal *entry points*; this ADR amends *implementation standing* only), [ADR 0030](0030-coordinator-authority-pipeline-unification.md), [ADR 0065](0065-curated-multi-engine-model-catalog.md), handbook [chapter 75](../architecture_handbook/75-architecture-and-review-engines.md)

## Context

ADR 0067 made **Create architecture** and **Review** co-equal jobs in the UI. The shipped code still implements architecture generation as the four-agent `IAgentExecutor` execute loop with `PackageOrigin=Created`. Handbook chapter 75 names this entanglement **F2**: either ADR 0067 overclaims (one kernel, two labels) or the code under-implements (two kernels with no type for synthesis).

Two owner options were recorded in `ENGINE_KERNEL_REMEDIATION_PROMPTS.md` EK-09:

- **Option L (labels):** one evaluation/generation pipeline; origin is a field on `Run`; stop talking about a distinct synthesis kernel.
- **Option K (kernels):** synthesis must not be `IAgentExecutor` execute; introduce `IArchitectureSynthesisKernel` (draft + generate) whose generate path does not require Topology/Cost/Compliance/Critic `AgentResult` as the definition of an architecture. Review remains `AuthorityPipelineStagesExecutor`.

The owner directed implementation of all EK prompts including EK-10, which exists only under Option K. Audience: platform contributors wiring create vs review HTTP paths.

## Decision

**Option K.** ArchLucid has two kernels:

1. **Architecture synthesis \(\mathcal{A}\)** — `IArchitectureSynthesisKernel` with `DraftAsync` and `GenerateAsync`. Drafts stay in `DraftRequests`. Generate may persist a `Created`-origin `Run` and may call LLMs, but **commit-readiness for a created architecture is not** `HasCommitReadyAgentResults({Topology, Cost, Compliance, Critic})`.
2. **Review evaluation \(\mathcal{R}\)** — `AuthorityPipelineStagesExecutor` (`Seq`: ingest → graph → findings → decisioning → artifacts). Start-review intent on `POST /v1/architecture/request` stays on authority coordination.

This ADR does **not** rewrite ADR 0067. Co-equal *entry points* remain. Artifacts remain unequal: a draft is not a sealed review record (ADR 0067 point 5). The four-agent execute loop remains legal for the review/agent-task path (TB-1007), not as the definition of synthesis success.

EK-10 is unblocked. Do not introduce a third kernel named “policy engine,” “quality engine,” or an LLM `IReviewEngine`.

## Trade-offs

Option K **gains** a type-level distinction that matches the two product jobs: synthesis can persist a draft or Created-origin run without pretending the four review agents ran, and review evaluation can stay the authority sequence whose completeness is stage outcomes plus a golden manifest pointer. Contributors stop planning against `IAgentExecutor` as “the architecture engine.” Replay, golden-cohort, and metering can attribute `AiUsageFeature.ArchitectureGeneration` to synthesis without overloading review execute.

It **gives up** the convenience of one create orchestrator that always starts authority `Seq` and one execute loop that finishes both jobs. Two persist paths mean two failure modes, two idempotency stories, and a period where older Created-origin runs still look like agent-task loops until callers migrate. First-run operators who used execute as “make me an architecture” lose that accidental alias. Engineering cost rises because `RunsController.CreateRun` must branch on `WorkflowIntent` instead of a single coordination call.

We **reject** Option L because it would freeze F2 as accepted entanglement and cancel EK-10, leaving ADR 0067’s co-equal jobs implemented as labels on one morphism.

## Constraints

- **ADR 0067 immutability:** do not rewrite that ADR; this record amends implementation standing only.
- **Unequal artifacts:** drafts remain mutable and unsealed; sealed review records remain governed and export-bearing.
- **ADR 0037:** tenant isolation stays catalog-per-tenant; no SQL RLS as the paying-client boundary.
- **ADR 0065 D5′ / D10:** do not put engine identity into `ManifestHash`; deterministic authority must stay independent of LLM catalog choice.
- **TB-1007:** execute/result/finalize remain the agent-task loop for review-shaped runs; they must not finish an authority-complete run.
- **No DTF requirement** for the synthesis kernel.
- **No third kernel** for policy packs or catalog routing.

## Expected impact

**System.** `IArchitectureSynthesisKernel` becomes the create-architecture port. Falsifiable: a Created-origin happy-path test does not call `EnsureCommitReadyAgentResults`; `ArchitectureSynthesisKernel` source does not reference `IArchitectureRunExecuteOrchestrator`; start-review still runs `Seq`. `ArchitectureRunStatus` numeric values stay pinned; completeness splits into additive DTO flags (EK-07).

**Security.** Synthesis still runs content-safety precheck on generate when a request is persisted. No new public exposure; catalog isolation and SoD on commit are unchanged. Falsifiable: generate does not write a golden manifest; drafts cannot be treated as sealed records.

**Operations.** Support gains an explicit “this run never ran authority stages” state via `AuthorityPipelineComplete=false`. Mixed-path execute on authority-complete runs fails closed. CI gains architecture tests for `IReviewEngine` absence and synthesis/execute isolation.

**Cost.** No new Azure resources. Duplicate persist paths add modest engineering time, not hosting spend. Generation metering stays on `AiUsageFeature.ArchitectureGeneration` where completions still occur.

**Teams.** Agents implementing create-architecture follow EK-10 rather than cloning review execute. UI copy (EK-11) must not half-rename TB-738/TB-1400 “Architecture packages” help titles without an owner override.

## Consequences

- **Positive:** F2 is decided; EK-10 is authorized; review evaluation keeps a single `Seq`.
- **Negative:** two persist paths until older Created-origin execute callers drain.
- **Follow-ups:** EK-01–EK-08 and EK-10–EK-12 in `ENGINE_KERNEL_REMEDIATION_PROMPTS.md`.
