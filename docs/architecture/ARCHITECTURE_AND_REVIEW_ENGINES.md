---
title: "ArchLucid architecture and review engines"
subtitle: "Formal specification, critique, and remediation prompts"
---

# ArchLucid architecture and review engines

**Date:** 2026-08-17  
**Version:** 2026.08.17a  
**Audience:** Owner, principal architects, coding agents  
**Canonical living copy:** `docs/architecture/architecture_handbook/75-architecture-and-review-engines.md`  
**Remediation prompts:** `docs/architecture/ENGINE_KERNEL_REMEDIATION_PROMPTS.md`

This Word file is a packaged export of (1) the typed specification of the architecture-synthesis kernel and the review-evaluation kernel, (2) the critique of flaws, incompleteness, unsatisfied boundary conditions, and simplifications, and (3) a sequenced set of copy-paste agent prompts that close those gaps.

**Rebuild the `.docx`:** concatenate this file, handbook chapter 75, and `ENGINE_KERNEL_REMEDIATION_PROMPTS.md`, then `pandoc ARCHITECTURE_AND_REVIEW_ENGINES.pack.md -o ARCHITECTURE_AND_REVIEW_ENGINES.docx --from markdown --toc --toc-depth 2`.

It is **platform documentation**, not a customer architecture-review package. It does not authorize new APIs by itself. Prompts EK-09 and EK-10 require an owner decision before generation is split from the agent-task loop.

## How to read

1. **Naming collisions** — four different things are called “engine.” Do not skip this.
2. **Kernels** — synthesis (create) vs evaluation (review) vs the misnamed `IReviewEngine` alias vs finding engines vs the LLM catalog.
3. **Algebra** — which maps are functions, which merges are not joins, what the manifest hash actually commits to.
4. **§11–§14** — boundary table, open problems, flaws, simplifications.
5. **Part II (prompts)** — run one prompt per chat, in the wave order at the end of the prompt set.

## Product signature (one screen)

| Job (ADR 0067) | Kernel | Durable output |
|----------------|--------|----------------|
| Create architecture | Synthesis — drafts and optional generation | Mutable draft; a `Run` with origin `Created` is not a sealed record |
| Review | Evaluation — authority pipeline | Findings, decision trace, golden manifest, exports |

Both jobs may persist through `dbo.Runs` after spawn. That shared table is a persistence spine, not proof that the jobs are sequential lifecycle steps.

There is **no** `IArchitectureEngine` type. `IReviewEngine` is an empty alias of `IAgentExecutor` (prompt EK-01 deletes it).

---

# Part I — Formal specification
