# 0055. Pre-Run Socratic Intake Loop and Mutable Draft Lifecycle

Date: 2026-06-15

## Status

Accepted

## Context

SAQ-013 asked whether ArchLucid should add a pre-run Socratic intake loop that elicits architecture intent from naive users (free text → clarifying questions → convergent draft → `ArchitectureRequest`). 

Currently, every LLM surface presupposes a frozen run/manifest (e.g., `AskService` throws without a committed manifest, and `CreateRunAsync` is single-shot). Supporting naive users requires three fundamental architectural additions:
1. A **pre-run, manifest-free reasoning surface**.
2. A **mutable draft-request lifecycle** (`draft` → `submitted` → `run`) distinct from today's submit-once-then-frozen `ArchitectureRequest`.
3. An **LLM semantic admission / domain-fit gate** that can reject or redirect non-architecture input.

## Decision

The owner has decided that the Socratic intake loop is an **absolute requirement for V1** and must be built robustly, even if it delays the release of the product.

We will implement the pre-run reasoning surface, the mutable draft lifecycle, and the LLM semantic admission gate.

## Consequences

- **Positive:** Dramatically lowers the barrier to entry for naive users. Ensures only valid, well-formed architecture requests reach the expensive execution pipeline.
- **Negative:** Significant engineering effort required. Delays V1 release. Introduces new state management (mutable drafts) into a previously immutable-first flow.
- **Action:** SAQ-013 is closed. Implementation of the Socratic intake loop is now the top priority V1 release blocker.