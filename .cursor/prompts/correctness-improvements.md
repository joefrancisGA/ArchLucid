<!-- Correctness improvement generator — run from Cursor chat or paste directly.
     Last updated: 2026-06-13. Complements `.cursor/prompts/assessment.md` (release readiness scoring). -->

ArchLucid is an AI-assisted Architecture Proof Engine sold to enterprise buyers: CTOs, chief architects, architecture review boards, and governance leads at organizations running regulated or Azure-heavy workloads. The product coordinates multi-agent topology, cost, and compliance analysis into versioned, evidence-linked architecture packages with a full audit trail. Clients are technical professionals — not casual consumers.

The UI design target is IBM Carbon Design System (primary) with Microsoft Fluent 2 shell polish. Correctness and proof integrity matter more than surface polish for this buyer profile.

## Current posture (repo state — do not re-litigate completed guardrails)

Correctness scores strongly (~93/100 in recent passes). Structural guardrails already shipped include:

- **TB-255–257** — faithfulness overlap density, empty-content rejection, adversarial hallucination corpus floor
- **TB-258–259** — trial preseed attempt caps and tests
- **TB-320** — run-detail KPI semantic contract + UI drift guard
- **TB-321** — route/tier/policy/nav snapshot enforcer
- **TB-322** — finalized evidence immutability integration tests
- **TB-323** — mutating endpoint idempotency contract harness
- **TB-324** — RAG citation fidelity enforcer
- **TB-325–327** — prompt injection guard, LLM fallback degradation, token budget enforcement

Residual risk concentrates in: real-mode AI faithfulness under adversarial prompts, buyer-visible UI/API semantic drift, retrieval quality silent degradation, and proof-language overclaiming in mixed simulator/live contexts.

## Your task

Give me **40 concrete, distinct engineering improvements** — backend logic, API contracts, AI/RAG evaluation, testing, drift guards, or UI/API parity — that would **measurably improve correctness, reliability, and AI faithfulness** for this enterprise system.

For each item:

- Be specific about what changes (exact component, test, guardrail, pipeline step, or contract file)
- Explain why it matters for an enterprise architect relying on the proof engine
- Mark **Done** if the repo already addresses it (cite file/test/backlog ID); do not duplicate TB-320–327 or completed faithfulness/preseed work
- Prefer **executable drift guards and integration tests** over speculative features

Organize the 40 items into these groups:

1. **AI Faithfulness & Hallucination Resistance**
2. **Evidence Immutability & Proof Semantics**
3. **UI/API Parity & Drift Guards**
4. **Idempotency & Failure Recovery**
5. **Retrieval & Pipeline Reliability**

## Constraints

- Avoid consumer-app aesthetics; respect Carbon/Fluent enterprise design when UI is touched
- Do not expand V1 scope into V1.1 connectors, MCP, multi-cloud analysis, CPA SOC 2, or third-party pen tests
- Do not recommend broad refactors or vanity coverage expansion
- Each suggestion must be verifiable (acceptance criteria + verification command)

## Output format

For each of the 40 items provide:

| Field | Content |
|-------|---------|
| **ID** | Suggested TB-### or BDA-style sub-id if applicable |
| **Title** | One line |
| **Status** | Open / Partial / Done |
| **Change** | Exact files, routes, tests, or scripts |
| **Why (buyer)** | One sentence for CTO/architect trust |
| **Acceptance** | Observable pass/fail criteria |
| **Verify** | Focused test or CI step |

After the 40 items, add:

- **Top 6 to implement next** (ranked; exclude Done items)
- **Recommended batching** (which items share files vs must run alone)
- **Model guidance** (Composer-safe vs strong-model review for proof semantics)
