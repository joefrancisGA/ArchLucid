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

## 2.1. Mandatory parallel-agent architectural coordination

**Centralize architectural coordination; decentralize implementation.** Applies to Cursor, ChatGPT, Codex and any authorized parallel or sequential agents whose work overlaps. It does not authorize spawning agents, starting background work, changing branches or merging without applicable permission. The coordinating agent owns integration; independent work need not wait on unrelated tasks.

### Before dispatch or implementation

- Establish the current target revision, requested outcome, relevant invariant IDs and likely shared components. Search the actual repository, canonical project map, existing extension points, active backlog, relevant open PRs and known in-flight assignments for overlapping capabilities and contracts. Search by responsibility and behavior, not just proposed type or file name. Treat unavailable agent-local workspaces or incomplete searches as unknown coordination coverage, not proof that nothing overlaps.
- Reuse or extend the existing component when its responsibility and contract fit. If a new shared capability is justified, record a concise rationale, proposed contract and owning implementation task before parallel consumers begin depending on it. Do not create another service, abstraction, schema, registry or policy evaluator merely because another implementation is not yet merged.
- Maintain a lightweight coordination record in existing task/issue/PR descriptions or a shared parent plan accessible to the participating agents. Record capability or responsibility, existing canonical implementation or proposed seam, implementation owner, branch/PR, dependencies, affected paths/contracts, acceptance criteria and status. For one bounded change, a brief note in its PR is sufficient. Do not introduce a second permanent component catalog or a new product-runtime coordination service just for this process.
- Assign a single implementation owner for each overlapping shared capability or contract; identify dependent integration work and agree on the interface, semantics, version and test expectations. Independent agents may implement disjoint consumers against an agreed contract using appropriate fixtures; distinguish fixture verification from actual integration verification. Avoid concurrent writes to the same files or conflicting contracts. Use isolated branches/worktrees when supported, preserve working-tree safety, and follow current agent execution policy.
- If a potential overlap cannot be resolved from available evidence, coordinate with the owner or parent agent, narrow the work or proceed with independent nonoverlapping tasks. Do not silently invent a competing implementation or claim an exclusive reservation that other agents cannot observe. Record stale or inaccessible coordination records and unresolved dependencies.

### During parallel work

- Keep the coordination record current when scope, contracts, dependencies or ownership change; promptly surface overlap to the coordinator. Do not unilaterally change a shared contract after consumer work has started. Reassign ownership explicitly if needed.
- Recheck current upstream source and relevant open PRs before introducing or modifying reusable functionality and before integration. A passing local test or a conflict-free textual merge is not evidence that competing abstractions are architecturally compatible.
- Preserve mandatory shared-component impact analysis, architectural invariants, authorization/tenant boundaries, test integrity, resource budgets and release-branch restrictions. Do not wait unnecessarily for unrelated work; serialize only conflicting architectural decisions, shared contract edits and dependent integration steps.

### Integration and completion

- The coordinator reviews the combined intended changes against the current integration baseline, not merely each individual PR. Check semantic duplication, competing ownership, dependency direction, contract/version compatibility, DI registration, shared state, persistence/API compatibility and applicable invariants. Reconcile overlap into the canonical component where appropriate; do not merge competing implementations simply because each branch is green.
- Integrate prerequisite contracts/components before dependent consumers, or verify the coherent combined change on an authorized integration branch. Run risk-adjusted affected-consumer and cross-component regression checks against the actual integrated revision; reuse existing evidence only when its revision and scope remain applicable. No unnecessary comprehensive builds or gate bypasses.
- Report the coordinator/owners, affected shared seams, integration order, combined-diff review evidence, checks performed, outstanding conflicts or unverified dependencies, and actual PR/merge status. If integration cannot be verified, label it incomplete; do not claim that all agents or worktrees were inspected when they were not.

This is a mandatory coordination procedure, not an atomic locking service or automatically enforced global agent registry. Existing Git/PR, review, architecture test and CI mechanisms remain authoritative. Separate authorization is required to implement new automation or enforcement.

## 2.2. Mandatory root-cause and systemic architectural remediation

**Correct the cause, not merely the symptom; make the smallest sound durable correction within authorized scope.** This standing rule applies to defect investigation and remediation across ArchLucid and SecureNow, including Cursor, ChatGPT, Codex and delegated agents, in production code, tests, configuration, infrastructure and delivery tooling. It concerns engineering defects in these products, not authority to remediate a customer's environment.

### Diagnose and establish the causal boundary

- Before implementation, identify the intended behavior, observed symptom, relevant requirement or invariant, reproducible evidence where feasible, and the mechanism that permits the defect. Distinguish a confirmed cause, candidate cause and unresolved diagnosis; do not equate correlation, repeated symptoms or model agreement with proof.
- Investigate whether the defect is isolated or represents a recurring architectural deficiency. Search by failure mechanism, responsibility and contract for sibling implementations, direct/transitive consumers, shared configuration, common abstractions, pending changes and known defects. Inspect applicable enforcement and independently sourced expected behavior. Record searched scope, known affected components and unknowns proportionally; do not claim repository-wide coverage from a narrow search.
- Identify the highest verified causal layer at which a correction is safe and justified. Locate and reuse the existing canonical implementation, shared boundary or prevention mechanism. Check the current [architecture invariant catalog](../library/ARCHITECTURE_INVARIANTS.md) and applicable accepted ADRs; identify missing or ineffective enforcement. Propose a new or revised invariant only when a durable cross-cutting requirement is justified, through existing governance. Do not invent a new architectural invariant or change an accepted decision without authorization.

### Select and authorize the correction

| Situation | Required disposition |
| --- | --- |
| Isolated defect | Correct the proven mechanism locally and preserve intended behavior with focused regression evidence. |
| Confirmed shared or recurring defect | Prefer a durable correction in the canonical shared implementation or enforcement boundary; check affected consumers and related instances. |
| Broad architectural deficiency | Establish affected scope, alternatives, dependencies, compatibility, migration/rollback needs, risks, acceptance criteria and staged verification; obtain appropriate authorization before materially expanding implementation. |
| Urgent stabilization or release blocker | Apply a safe, narrowly scoped containment only if warranted; preserve invariants and required gates, identify residual risk and record separately tracked systemic remediation before declaring the work complete. |
| Uncertain root cause or insufficient authority | Continue bounded evidence gathering, narrow to an independently justified correction or report the blocker; do not launch speculative redesign or present an unverified hypothesis as established. |

- Compare tactical correction, shared correction and structural prevention by causal evidence, recurrence risk, affected scope, disruption, compatibility and cost. A larger diff is not inherently a better root-cause fix; a smaller diff is not inherently adequate. Do not introduce repetitive local patches when a proven, authorized common correction is feasible.
- Preserve the shared-component impact analysis and parallel-agent coordination procedures. Obtain explicit authorization for material scope expansion, incompatible contract changes or changes to accepted architecture. Coordinate shared ownership and dependent changes; avoid unrelated cleanup or speculative refactoring.
- A temporary mitigation must not knowingly violate a mandatory invariant, weaken authorization, suppress tests or bypass required release gates. If safe containment is not possible, escalate the blocker rather than obscure it. A release deadline does not itself authorize an exception.

### Durable prevention, tracking and closure

- Reuse the [automatic regression policy](../assurance/AUTOMATIC_REGRESSION_POLICY.md), existing defect-prevention controls and [test execution model](../library/TEST_EXECUTION_MODEL.md). Verify the causal correction with independently justified regression/negative controls, preferably red before and green after; check affected sibling cases and direct/transitive consumers. Prefer structural prevention or focused analyzer/architecture-test enforcement when it can eliminate the defect class; do not introduce a duplicate guard or claim prevention without evidence.
- If systemic remediation is deferred, blocked or only partially delivered, locate and update the existing [active technical backlog](../ACTIVE_TECHNICAL_BACKLOG.md) item or propose a deduplicated linked entry using the existing process. Record evidence and affected scope, residual risk, priority, proposed owner, dependencies, acceptance criteria, and a review trigger or target milestone when agreed. Link the tactical PR and systemic follow-up. Do not silently drop unresolved work or create competing entries. If backlog write access or authorization is unavailable, report the concrete proposed entry and blocker.
- Report local symptom resolution separately from verified systemic cause correction and recurrence prevention. Include causal evidence, applicable invariant IDs, searched/affected scope, correction choice, tests actually run, unresolved risks and actual backlog/PR status. Do not close a systemic defect merely because the initial regression passes or a temporary mitigation was merged.
- Keep verification risk-adjusted and within authorized resource and release-branch limits. A broad investigation does not authorize comprehensive master CI, automatic merges, production deployment or customer mutation. This is mandatory procedural agent guidance, not a claim of universal executable enforcement.

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
