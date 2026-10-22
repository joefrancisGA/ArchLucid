> **Regeneration note (2026-07-07, evening):** This document is a **reconstruction**, not a recovered original. The original assessment (produced earlier the same day) existed only as an untracked file and disappeared from the working tree before it was committed. It has been rewritten from the conversation record that referenced it — the concrete code findings below (§A, evidence citations) are the same ones actually found during the original review; the severity number, and the exact wording of fixes D.8 and D.10 in particular, are reconstructed judgment calls and may not be verbatim identical to the original. Treat this as authoritative going forward; it supersedes the missing original.

# Architecture generation technology consistency — assessment

**Role:** Senior product strategist, enterprise architect, and skeptical buyer evaluator, assessing ArchLucid's architecture generation/review pipeline as a product-trust, architecture-coherence, and evidence-integrity problem.

**Symptom under review:** ArchLucid's generated architectures interchange cloud providers, databases, identity systems, and other technology choices frequently and inconsistently within a single run and across a review's revision history, with no persisted, canonical record of what technology fills what role or why it was chosen.

---

## A. Severity rating: **78 / 100** (high — launch-relevant, not an immediate hard blocker)

This is rated high rather than catastrophic because:
- The underlying agent pipeline still produces plausible, individually-coherent architectures per run; the defect is *consistency and traceability across and within runs*, not "the output is garbage."
- It is fully fixable with additive, non-destructive changes (a ledger + validation layer) rather than a pipeline rewrite.

It is rated high rather than moderate because:
- ArchLucid's core value proposition is **trustworthy, evidence-grounded architecture output** for buyers who will show this to their own architects, auditors, and procurement reviewers. Technology inconsistency is exactly the kind of defect a skeptical technical buyer notices in the first five minutes of a demo, and it directly undermines the "this is trustworthy enough to bring into a real environment" claim.
- The root causes are structural (missing data model, not a prompt-wording typo), so the defect will keep recurring under normal use until the data model exists — it is not self-limiting.

## B. Top 5 root causes

1. **No canonical technology record exists anywhere in the data model.** There is no persisted "this run's identity provider is X, this run's primary datastore is Y" ledger. Every agent (Topology, Cost, Compliance, Critic) infers technology choices independently, per call, from whatever context happens to be staged for it — so nothing prevents two agents (or two calls to the same agent across a revision) from landing on different providers for the same role.
2. **Silent Azure default at intake.** `DraftRequestProjector` always sets `CloudProvider = CloudProvider.None` during draft intake regardless of what the user actually said, so "no explicit choice" and "no choice recorded yet" are indistinguishable by the time generation starts.
3. **Agent prompts hard-code an Azure-first assumption when no provider is set.** `TopologyAgentHandler` explicitly instructs the model to "Produce a simple, coherent MVP-quality **Azure** topology" and "Prefer **App Service** over AKS" whenever `CloudProvider` is `None` — so a cloud-neutral or undecided intake silently becomes an Azure-flavored output, and any later signal that should have meant AWS or GCP has to fight this default rather than being additive to it.
4. **AWS/GCP overrides are only additive, never authoritative.** `CloudProviderAgentPromptComposer` appends an AWS or GCP override clause to the prompt only when `CloudProvider` is explicitly `Aws` or `Gcp` — there is no equivalent clause for `None` (cloud-neutral), so the Azure-first default in root cause #3 has nothing to counterbalance it in the common "no explicit provider" case.
5. **No deterministic validation between generation and commit.** Whatever technology choices an agent's free-text output implies, nothing checks them against prior agents' choices, prior revisions, or an evidence source before the result reaches the user or gets committed — inconsistency is only ever caught by a human reading the whole document closely, if at all.

## C. Top 5 product risks

1. **Trust erosion on first serious evaluation.** A technical buyer who feeds in one clear signal (e.g. "we're an AWS shop") and then sees Azure services appear anywhere in the output will reasonably conclude the tool doesn't actually track their constraints — this is a first-demo-killing defect for the exact audience ArchLucid needs to convert.
2. **Procurement and compliance exposure.** Buyers evaluating this for regulated environments (the same audience the SOC/trust-center positioning targets) will read technology drift as evidence the tool cannot be relied on for anything that has to hold up in an audit — directly undermining the "evidence-grounded" and "trustworthy AI architecture" claims elsewhere in the product's positioning.
3. **Compounding errors across revisions.** Because nothing is canonical, a Critic or Cost agent revising a run has no ground truth to check against; inconsistency introduced in one revision can silently propagate or worsen in the next, rather than being caught and corrected.
4. **Support and cost-estimate integrity risk.** Cost and Compliance agents reasoning from a technology set that silently drifted from what was actually chosen produce cost estimates and compliance findings that are wrong for the *actual* target environment — a second-order trust failure that's harder to spot than an obviously wrong diagram.
5. **Positioning/reality gap.** `CloudProvider`'s own doc comments already concede that AWS and GCP get only "Phase 1 intent capture" while Azure gets "deep cloud-analysis" — if buyer-facing messaging does not make this distinction explicit, buyers who pick AWS/GCP will be sold a depth of analysis the pipeline does not yet deliver for their provider.

## D. Top 10 fixes, prioritized

| # | Fix | Why this priority |
| --- | --- | --- |
| **D.1** | **Technology Ledger data model** — a canonical, persisted per-run record of which technology fills which architectural role, its provider family, approval status, and source (user / evidence / agent-proposed). | Nothing else on this list is buildable without a ground truth to write to and read from. Purely additive; near-zero risk. |
| **D.2** | **Wire the ledger into intake** — make target-cloud-or-neutral an explicit, required, honestly-recorded answer (fixing the `DraftRequestProjector` silent-`None` default), and seed `source: user` ledger entries from it. | Closes root cause #2 directly; this is the cheapest, highest-leverage single fix on the list. |
| **D.3** | **Inject the ledger into agent objectives** — `TopologyAgentHandler` / `RunStarterTaskFactory` read the ledger instead of re-deriving provider assumptions per call; agent output becomes `source: agent-proposed` ledger entries instead of untracked free-text `ProposedChanges`; share the ledger downstream to Cost/Compliance/Critic via `StagedPriorAgentsSummary`. | Closes root causes #3 and #4 — replaces the Azure-first hard-coded default with an explicit, ledger-driven decision, and gives every downstream agent the same ground truth. |
| **D.4** | **`TechnologyConsistencyFindingEngine`** — deterministic provider/database/identity/messaging/runtime mismatch detection, wired into `PreCommitGovernanceGate` behind a warn-only/enforcing toggle (mirroring the existing `AgentOutputQualityGateOptions` pattern) so it ships surfacing findings without blocking existing sample/demo runs until explicitly flipped to enforcing. | Closes root cause #5 — the actual validation gate. Warn-only rollout avoids breaking existing content while surfacing the problem immediately. |
| **D.5** | **Structured-first artifact synthesis** — lint exported prose/diagram narrative against the ledger in `ArtifactSynthesisService` so exported documents can't describe a technology the ledger doesn't corroborate. | Extends validation to the buyer-facing deliverable, not just the internal pipeline state. |
| **D.6** | **Prompt template updates** — add a closed-world clause (only use technologies present in the ledger or explicitly marked alternative), a neutral-mode clause (what to do when `CloudProvider` is genuinely `None`, as opposed to unset), and an alternative-labeling clause (any technology mentioned that isn't the active choice must be explicitly labeled as an alternative) across all four system prompt templates. | Prevention at the generation source, complementing the after-the-fact validation in D.4/D.5. |
| **D.7** | **API + UI Technology Baseline panel** — expose the ledger via `GET`/`PATCH` endpoints and surface it as a reviewable, editable panel in `archlucid-ui` with an explicit human approval step. | Makes the baseline visible and controllable to the user, not just enforced invisibly — critical for buyer trust and for correcting agent-proposed entries before they're treated as chosen. |
| **D.8** | **Buyer-facing positioning honesty pass** — audit trust-center, demo, and marketing copy against the actual maturity split already documented in `CloudProvider.cs` (Azure: deep cloud-analysis; AWS/GCP: Phase 1 intent capture only) and correct any claim that implies equal-depth multi-cloud analysis today. | Zero engineering risk, pure positioning correction — but must land before or alongside D.1–D.7 reach buyers, or the product oversells itself the moment the ledger makes the AWS/GCP depth gap externally visible for the first time. |
| **D.9** | **Golden-corpus consistency scenarios in CI** — add fixed input/output regression scenarios that assert no technology drift across a known run's revisions, so this class of defect is caught by CI before it reaches a demo or a customer. | Prevents regression once D.1–D.6 land; lowest priority only because it depends on all the above existing first. |
| **D.10** | **Evidence-linking closure for "Chosen" entries** — before a ledger entry can be exported or cited as authoritative, require it to carry either a `User`-source intake answer or an `Evidence`-source citation (reusing the existing citation/evidence system rather than inventing a new one); agent-proposed entries without either stay `Assumed` and are visually distinguished wherever shown. | Closes the loop between D.1's ledger and the product's existing evidence-grounding story — without this, "Chosen" status can itself become another ungrounded claim. |

## E. Proposed architecture generation workflow

1. **Intake** records an explicit target-cloud-or-neutral answer (D.2) and any IaC/inventory evidence uploads; both seed `TechnologyLedgerEntry` rows tagged `source: user` or `source: evidence` respectively, `status: Chosen` when the evidence is unambiguous.
2. **Generation** — each agent (Topology, Cost, Compliance, Critic) reads the current ledger before composing its prompt (D.3), proposes new/changed entries as `status: Assumed, source: AgentProposed` rather than free text, and the orchestrator merges proposals into the ledger without silently overwriting `Chosen`/locked entries.
3. **Validation** — `TechnologyConsistencyFindingEngine` (D.4) runs deterministic checks (one active choice per role per run; no unresolved provider-family mismatch across roles) before commit; findings surface as warnings first, then as enforcing blocks once tuned.
4. **Synthesis** — exported artifacts are lint-checked against the ledger (D.5) before packaging.
5. **Review** — the user sees a Technology Baseline panel (D.7) showing every `Chosen` and `Assumed` entry, can approve/lock or correct agent proposals, before the run is finalized.
6. **Regression** — golden-corpus CI scenarios (D.9) re-run this whole path against fixed inputs on every pipeline change.

## F. Validation model to prevent technology drift

- **Uniqueness constraint (logical, not just DB-level):** for a given run, at most one `status: Chosen` entry per `TechnologyLedgerRole`. A second `Chosen` entry for the same role with a different `ProviderFamily` is a hard consistency violation.
- **Closed-world generation constraint:** agents may only introduce a technology into their output if it exists in the ledger as `Chosen`, `Assumed`, or explicitly `Alternative`; anything else must be flagged rather than silently rendered.
- **Lock semantics:** `IsLocked = true` entries (user-approved) cannot be overwritten by a later `AgentProposed` entry without an explicit human action — prevents an agent's next-revision pass from silently reverting an approved choice.
- **Evidence-or-provenance requirement:** `Chosen` status should be backed by `source: User` or `source: Evidence` (D.10); `AgentProposed` entries remain `Assumed` until a human or evidence source promotes them.
- **Warn-then-enforce rollout:** the finding engine ships warn-only (D.4) so existing content isn't broken retroactively, then flips to enforcing once false-positive rate is acceptable on real runs.

## G. UI changes to make the technology baseline visible and controllable

- A **Technology Baseline panel** (D.7) on the run view listing every ledger entry: role, technology name, provider family, status badge (Chosen / Assumed / Alternative / Future), source badge, and evidence citation link when present.
- **Inline approve/correct actions** on `Assumed` entries — promote to `Chosen` (and optionally lock), or replace with a different technology, without leaving the panel.
- **Drift warnings surfaced inline**, not buried in a separate report — if `TechnologyConsistencyFindingEngine` flags a mismatch, show it directly against the conflicting ledger rows.
- **Explicit "cloud-neutral" state** distinguished visually from "not yet answered" wherever the target-cloud question is shown, closing the intake-side half of root cause #2.

## H. Prompt changes for the generation engine

- **Closed-world clause:** "Only reference technologies already present in the supplied Technology Ledger context, or explicitly introduce a new one as an `Assumed` proposal — never substitute a different provider's equivalent service without flagging it as a proposed change."
- **Neutral-mode clause:** replace the current unconditional "Produce a ... Azure topology" instruction with a branch — Azure-specific guidance only when `CloudProvider == Azure`; a genuinely provider-neutral instruction set when `CloudProvider == None`; AWS/GCP-specific guidance (already partially present via `CloudProviderAgentPromptComposer`) when set to those.
- **Alternative-labeling clause:** any technology mentioned that is not the active ledger choice for its role must be explicitly introduced as "an alternative under consideration," never presented as if already chosen.

## I. Acceptance criteria for "architecture generation is trustworthy"

1. For any completed run, every architectural role represented in the output maps to exactly one `Chosen` (or explicitly `Assumed`-and-flagged) Technology Ledger entry — no role has two silently conflicting technologies across the same run's output.
2. No agent-proposed technology reaches an exported artifact without being distinguishable (in the ledger and, per D.5/D.7, in the UI) as `Assumed` until a human approves it.
3. `TechnologyConsistencyFindingEngine` runs on every commit; in enforcing mode, zero unresolved consistency findings on a committed run.
4. A user who answers "AWS" (or "cloud-neutral") at intake sees zero unprompted Azure-specific services in the output, and vice versa.
5. Golden-corpus CI scenarios (D.9) pass on every change to the generation pipeline.

## J. Launch gating recommendation

**Do not block V1 general availability on this**, but treat it as a **beta-exit / GA-readiness blocker for any buyer-facing demo or trial involving a non-Azure or explicitly cloud-neutral target** — because that is precisely the scenario where the defect is externally visible and trust-damaging. Recommended sequencing:
- Ship D.1–D.4 (ledger, intake wiring, agent wiring, validation engine in warn-only mode) before running any additional AWS/GCP-target trials or demos.
- Ship D.8 (positioning honesty pass) in parallel — it has no engineering dependency and closes the positioning-gap risk (§C.5) immediately.
- D.5–D.7, D.9, D.10 can land incrementally after that without blocking further trials, since by that point the core inconsistency defect (silent drift) is already closed and the remaining items are depth/polish/regression-safety, not correctness.
