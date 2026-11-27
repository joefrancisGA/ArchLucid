> **Scope:** Mandatory engineering procedure for AI-assisted work on ArchLucid and SecureNow, including ChatGPT, Codex, Cursor and delegated agents. Internal contributor guidance; not product assurance or a claim of universal automated enforcement.

# Common AI-assisted development governance

**Owner directive:** effective immediately (2026-11-26). Apply this procedure to engineering work initiated by or performed for the owner, regardless of agent, model or client. This document coordinates existing requirements; it does not create competing architectural standards or authorize new operational capabilities.

## 1. Load the canonical instructions

Before substantive repository work, identify the repository, target branch/revision and requested scope. Read the current root [AGENTS.md](../../AGENTS.md), [engineering agent guidance](AGENTS.md), applicable scoped instructions (including [UI AGENTS.md](../../archlucid-ui/AGENTS.md) where relevant), [architecture invariant catalog](../library/ARCHITECTURE_INVARIANTS.md), and applicable accepted ADRs. For Cursor, also follow the active architecture-invariants and shared-component impact-analysis MDC rules when present. Do not treat an archived or proposed rule as an active repository rule. If a required rule is unavailable, disclose that limitation and follow the substantive requirements in this document and the available canonical sources; do not silently assume compliance.

ChatGPT conversations using a repository connector must explicitly retrieve the relevant instructions rather than assume that Cursor MDC rules or nested AGENTS.md files have been injected automatically. Codex and Cursor must respect their scoped instruction-loading mechanisms. Refresh relevant instructions when the target revision or task scope changes. Repository guidance is subordinate to platform safety constraints, the user's current authorization and accepted architectural decisions. Surface conflicts rather than bypass them.

## 2. Mandatory engineering workflow

1. **Diagnose before editing.** Identify the actual defect or requested outcome, acceptance criteria and relevant evidence. Reproduce defective behavior with a focused test when feasible; distinguish a hypothesis from a verified defect.
2. **Identify invariants and architectural reuse.** Read relevant invariant IDs and accepted decisions; locate existing extension points, interfaces, implementations and tests before creating new infrastructure. Preserve tenant and product isolation, authorization, audit/evidence integrity, cost controls, production safety, and architectural boundaries. No silent weakening of an invariant, accepted decision or enforcement mechanism.
3. **Perform shared-component impact analysis.** For common implementations, cross-layer contracts, common configuration and infrastructure, trace direct and transitive consumers to the affected behavior boundary. Inspect DI, interfaces, dynamic consumers, generated clients, persistence, deployment and test dependencies where relevant. Record known impacts, searched scope, unknowns, preserved behavioral/security contracts and a risk-adjusted verification plan before implementation. If the dependency boundary cannot be established, investigate, narrow the change or disclose the blocker; unknown impact is not zero impact. Reuse existing investigation evidence and avoid needless paperwork.
4. **Implement the smallest sound change.** Stay within authorized files, behavior and branch scope. Reuse canonical implementations rather than duplicate services, schemas or enforcement mechanisms. Maintain API, serialization, data compatibility, error semantics, concurrency and legitimate consumer behavior unless a contract change is explicitly authorized and governed. Protect existing user edits and isolate unrelated changes.
5. **Verify affected behavior.** Select tests by risk, contracts and consumer impact. Preserve test assertions, analyzers, test discovery, filters and CI gates. Never remove, weaken, skip or suppress them merely to produce green results. Add regression and negative-control coverage as appropriate; use independent deterministic evidence for consequential claims. Independently review material shared/security changes when a genuinely separate reviewer is available and authorized. Otherwise perform a clearly labeled self-review and disclose missing independent review; do not pretend a second agent was used.
6. **Report actual evidence and unresolved work.** Reconcile the final diff with the impact assessment, applicable invariants and requested scope. Distinguish implemented, verified, failed, not run, blocked and deferred. Record source revision, changed paths, commands, observed results, test counts when available, remaining limitations, and PR status. A timeout, zero discovered tests, skipped check, mock-only result or absence of errors does not establish full behavioral correctness.

## 3. Risk-adjusted verification and cost

Use the existing [test execution model](../library/TEST_EXECUTION_MODEL.md), [build guidance](BUILD.md) and [independent model review practice](../quality/INDEPENDENT_MODEL_CODE_REVIEW.md). The following is a minimum planning guide, not a substitute for applicable required checks:

| Change | Verification plan |
| --- | --- |
| Documentation/instructions only | Inspect scope, references, consistency, syntax/frontmatter and diff; no unnecessary product build. |
| Isolated implementation | Scoped compile/typecheck and targeted behavioral regression. |
| Shared implementation | Affected direct/transitive consumer and contract regression, appropriate scoped Release compile/typecheck. |
| Security or tenant boundary | Relevant negative controls and independent review of material changes, plus the affected tests. |
| API, persistence or serialization contracts | Relevant integration, generated-client and backward-compatibility verification; use real dependencies where required. |
| Cross-cutting architecture or release candidate | Expanded affected verification, independent review of material risks and authorized release gates. |

Use existing scripts and infrastructure. Respect resource budgets, cancellation and time limits without converting incomplete verification into a pass. No comprehensive master CI by default; comprehensive verification belongs on the owner-designated release branch under the current owner-approved policy. Recheck that policy rather than assume a historical release number is still current. Never dispatch a comprehensive build, bypass a required gate, or merge solely to reduce expense without applicable authorization.

## 4. Repository and operational authority

- Check current target branch, revision, pending PRs and affected files before writing; avoid duplicated or conflicting work. Do not overwrite unrelated edits or silently expand scope.
- Follow the active branch-naming, working-tree, commit/push, review and merge policies. Use a feature branch and PR for ordinary changes; do not merge or enable automatic merge without the owner's authorization. Preserve owner-designated release restrictions.
- No production deployment, billing change, secret disclosure, customer-environment mutation or external notification is authorized by these instructions.
- Check the [active technical backlog](../ACTIVE_TECHNICAL_BACKLOG.md) and existing PRs before creating requirements; extend existing work where feasible. Record confirmed backlog changes and distinguish proposed entries, open PRs, merged entries and verified implementation.
- For completed ArchLucid/SecureNow architecture examination exchanges, follow the maintenance contract in the [architecture Q&A](../architecture/QUESTIONS_AND_ANSWERS.md), recording the answer, assessment, refinements and backlog references. Do not invent transcripts or completed work.

## 5. Compact completion checklist

For substantive shared-impact work, the completion summary or PR should identify the requested outcome; target revision and changed paths; applicable invariant IDs; affected consumers/contracts and remaining unknowns; regression and verification evidence; unverified work and blockers; and actual branch/PR status. Keep this proportional to the work. For read-only and documentation-only tasks, report the relevant static checks and limitations rather than claiming product test results.

## 6. Enforcement and maintenance

This is mandatory procedural guidance for cooperating agents, not an executable security or CI boundary. Existing architecture tests, analyzers, hooks, required checks and access controls remain the enforcement mechanisms; their current coverage must be established from evidence. New executable enforcement requires separate authorized implementation and validation. A prompt, a checked-in rule, AI agreement or a green compile alone is not proof of architectural compliance.

Keep this common protocol aligned with the canonical catalog, scoped agent instructions and active Cursor rules. Update references rather than duplicating the invariant catalog or maintaining divergent model-specific policies. Ordinary ChatGPT conversations do not automatically load this file; a durable ChatGPT project instruction or custom instruction should direct the assistant to retrieve it for repository tasks. Committing this file does not change ChatGPT account settings.
