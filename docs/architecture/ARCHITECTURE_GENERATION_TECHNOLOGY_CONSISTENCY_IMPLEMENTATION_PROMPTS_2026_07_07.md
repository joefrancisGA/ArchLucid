> **Scope:** Copy-paste Composer/agent prompts implementing fix D.1–D.10 from the assessment below, run **one at a time directly against `master`**. Each prompt is self-contained (restates relevant context) so it can be run in a fresh Composer session with no prior chat history. Review the diff and test results after each prompt before starting the next.
>
> **Assessment date:** 2026-07-07
> **Source assessment:** [`ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md`](ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md) — read this first; it contains the full diagnosis, severity rating, root causes, and the fix D.1–D.10 priority order that these prompts implement. **Note (2026-07-07, evening):** the original assessment file disappeared from the working tree before it was committed (it was untracked). It has been **regenerated** (same date) from the conversation record rather than recovered byte-for-byte — see the regeneration note at the top of that file for what is reconstructed vs. verbatim.
>
> **Workflow (owner decision, 2026-07-07):** Prompts run **directly on `master`**, no feature branches, local commits only after each prompt's tests pass — do not push to `origin/master` unless explicitly requested. This mirrors the workflow already used for [`OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md`](OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md). **Exception:** for Prompt 1, the owner explicitly asked to push to `origin/master` as part of running it (2026-07-07); the default for Prompt 2 onward remains local-commit-only unless push is explicitly requested again.

# Architecture generation technology consistency — implementation prompts

**Status:** Prompt 4 **drafted** below (not yet run). Prompt 3 **done** (`c23ec43b4d`). Prompt 1 **done** (`daaa784505`). Prompt 2 **done** (`599b51c74a`) — see reports below.

Work directly on `master` for every prompt below. Confirm `git status` is clean of unrelated changes before starting each prompt; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

---

## Planned sequence (subject to revision after each step)

| # | Fix (from assessment §D) | Scope | Status |
| --- | --- | --- | --- |
| **1** | D.1 | Technology Ledger data model — contracts, SQL table, repository (additive only; nothing reads or writes it yet) | **Done** (`daaa784505`) |
| 2 | D.2 | Wire ledger into intake: required target-cloud/neutral question, fix `DraftRequestProjector`, seed `source: user` ledger entries from `ArchitectureRequest` | **Done** (see Prompt 2 report) |
| 3 | D.1 (cont.) | Seed `source: evidence` ledger entries from context connectors (IaC declarations, cloud inventory ZIP) | **Done** (see Prompt 3 report) |
| 4 | D.3 | Inject ledger into `TopologyAgentHandler` / `RunStarterTaskFactory` objectives; agent proposals become `source: agent-proposed` ledger entries instead of untracked `ProposedChanges` free text | **Drafted, not run** |
| 5 | D.3 | Share ledger downstream to Cost/Compliance/Critic prompts (extend `StagedPriorAgentsSummary`) | Not started |
| 6 | D.4 | `TechnologyConsistencyFindingEngine` — deterministic provider/database/identity/messaging/runtime mismatch detection, wired into `PreCommitGovernanceGate` **behind a warn-only/enforcing options toggle** (mirroring the existing `AgentOutputQualityGateOptions` enable/severity pattern) so it ships surfacing findings without blocking commits on existing sample/demo runs until explicitly flipped to enforcing | Not started |
| 7 | D.5 | Structured-first artifact synthesis — prose lint against ledger in `ArtifactSynthesisService` | Not started |
| 8 | D.6 | Prompt template updates — closed-world clause, neutral-mode clause, alternative-labeling clause across all four system prompt templates | Not started |
| 9 | D.7 | **API endpoint** — `GET`/`PATCH` ledger routes on the run so the UI has something to call (missing piece between the repository and the UI panel; not called out as its own fix in the assessment but required before step 10 can work) | Not started |
| 10 | D.7 | Technology Baseline UI panel + approval step (`archlucid-ui`), consuming the endpoint from step 9 | Not started |
| 11 | D.9 | Golden-corpus consistency scenarios in CI | Not started |

Prompts 1–4 are written out below. Run Prompt 4, review the result, then ask for Prompt 5 to be drafted.

---

## Prompt 1 — Technology Ledger data model (contracts + persistence, additive only)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A (root causes), §D fix 1, §F (validation model), and the Appendix diagram. This prompt implements ONLY the data model — no agent, prompt, evidence-builder, or UI wiring yet. That is deliberate; later prompts build on this.

Work directly on the current branch (master) — no feature branch. Confirm `git status` is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Add a canonical, persisted "Technology Ledger" per architecture run: a small set of entries recording which technology fills which architectural role, its provider family, its approval status, and where it came from. This is purely additive (new files, new table) — nothing in the existing pipeline reads or writes it yet.

## 1. Contracts (ArchLucid.Contracts)

Follow the existing style exactly: one type per file, `namespace ArchLucid.Contracts.Persistence.TechnologyLedger;`, XML `<summary>` doc comments on every public type and member, nullable reference types respected (`string?` where genuinely optional). Look at `ArchLucid.Contracts/Common/CloudProvider.cs` and `ArchLucid.Contracts/Persistence/DecisionTraces/` for exact formatting conventions (brace placement, doc comment style) before writing these.

Create under a new folder `ArchLucid.Contracts/Persistence/TechnologyLedger/`:

1. `TechnologyLedgerRole.cs` — enum identifying the architectural role a ledger entry fills. Values: `CloudPlatform`, `IdentityProvider`, `PrimaryDatastore`, `Messaging`, `ComputeRuntime`, `Region`, `IacTarget`, `Other`. XML doc comment on the enum and each member explaining what it constrains (e.g. `PrimaryDatastore` = "the system's primary relational or document datastore; a second entry with this role for a different provider family is a consistency violation").

2. `TechnologyLedgerStatus.cs` — enum: `Chosen` (user- or evidence-confirmed, authoritative), `Assumed` (agent-proposed, not yet approved), `Alternative` (explicitly an option under consideration, never the active choice), `Future` (roadmap/out-of-scope-for-this-run). XML doc comment per value.

3. `TechnologyLedgerSource.cs` — enum: `User` (explicit intake answer), `Evidence` (derived from uploaded IaC/inventory/documents), `AgentProposed` (an agent introduced it during generation). XML doc comment per value.

4. `TechnologyLedgerEntry.cs` — sealed class (mutable persisted entity, matching the style of `ArchLucid.Contracts/Agents/AgentExecutionTrace.cs`) with properties:
   - `string EntryId` (required, non-empty identifier — generate via `Guid.NewGuid().ToString("N")` convention used elsewhere in the codebase; check `AgentExecutionTrace` or similar for the exact id-generation convention already in use and match it)
   - `string RunId` (required)
   - `TechnologyLedgerRole Role`
   - `string TechnologyName` (required, non-empty — e.g. "Azure SQL Database", "PostgreSQL", "Amazon RDS")
   - `ArchLucid.Contracts.Common.CloudProvider ProviderFamily` (reuse the existing enum rather than inventing a new one; use `CloudProvider.None` for provider-agnostic entries like a generic runtime role under cloud-neutral posture)
   - `TechnologyLedgerStatus Status`
   - `TechnologyLedgerSource Source`
   - `string? EvidenceRef` (nullable — a citation/reference id when `Source` is `Evidence` or the entry is grounded; null when not yet grounded)
   - `string? Rationale` (nullable — free text explaining why this technology was chosen or proposed)
   - `bool IsLocked` (default `false` — sets whether this entry can be overwritten by a later agent proposal without an explicit human action; this flag is not yet enforced anywhere in this prompt, just persisted)
   - `DateTime CreatedUtc`
   - `DateTime UpdatedUtc`

   Add a static factory method or constructor pattern only if that matches an existing sibling type's convention — check `AgentExecutionTrace.cs` first and mirror whatever pattern (plain settable properties vs. `required` + factory) it uses so this type looks native to the codebase, not bespoke.

Add null/empty argument guards consistent with the codebase's existing convention for this kind of entity (check whether `AgentExecutionTrace` or similar validates in a constructor, in a factory method, or not at all at the contract layer and relies on validation elsewhere — match whatever you find, do not invent a new validation style).

## 2. SQL — migration + consolidated script

Determine the next migration number by listing `ArchLucid.Persistence/Migrations/*.sql` and taking the highest existing numeric prefix + 1 (do not hardcode a number from memory — other work may have landed migrations since this prompt was written). Name the file `<NNN>_TechnologyLedgerEntries.sql`.

Follow the exact conventions in `ArchLucid.Persistence/Scripts/ArchLucid.sql`'s `DecisionTraces` table and a recent migration file (e.g. `251_DraftRequests.sql`) for structure: idempotent `IF OBJECT_ID(N'dbo.TechnologyLedgerEntries', N'U') IS NULL BEGIN ... END` guard, `GO` batch separator, PK/FK/CHECK/index naming (`PK_`, `FK_`, `CK_`, `IX_`).

Table `dbo.TechnologyLedgerEntries`:
- `EntryId NVARCHAR(64) NOT NULL PRIMARY KEY`
- `RunId UNIQUEIDENTIFIER NOT NULL`
- `Role NVARCHAR(32) NOT NULL` with `CK_TechnologyLedgerEntries_Role CHECK (Role IN (N'CloudPlatform', N'IdentityProvider', N'PrimaryDatastore', N'Messaging', N'ComputeRuntime', N'Region', N'IacTarget', N'Other'))` — enum value names must exactly match the C# enum member names from step 1 so a future `Enum.Parse` round-trips cleanly
- `TechnologyName NVARCHAR(200) NOT NULL`
- `ProviderFamily NVARCHAR(16) NOT NULL` with a `CK_TechnologyLedgerEntries_ProviderFamily CHECK (ProviderFamily IN (N'None', N'Azure', N'Aws', N'Gcp'))` matching `CloudProvider` enum member names exactly
- `Status NVARCHAR(16) NOT NULL` with `CK_TechnologyLedgerEntries_Status CHECK (Status IN (N'Chosen', N'Assumed', N'Alternative', N'Future'))`
- `Source NVARCHAR(16) NOT NULL` with `CK_TechnologyLedgerEntries_Source CHECK (Source IN (N'User', N'Evidence', N'AgentProposed'))`
- `EvidenceRef NVARCHAR(200) NULL`
- `Rationale NVARCHAR(2000) NULL`
- `IsLocked BIT NOT NULL DEFAULT (0)`
- `CreatedUtc DATETIME2 NOT NULL`
- `UpdatedUtc DATETIME2 NOT NULL`
- `INDEX IX_TechnologyLedgerEntries_RunId NONCLUSTERED (RunId)`
- `INDEX IX_TechnologyLedgerEntries_RunId_Role NONCLUSTERED (RunId, Role)`

Do NOT add a hard `FOREIGN KEY` to `dbo.Runs` inline if the existing convention in `ArchLucid.sql` adds run FKs as a separate deferred `ALTER TABLE ... WITH NOCHECK ADD CONSTRAINT FK_...` block later in the file (check how `DecisionTraces` or `AgentExecutionTraces` does it and match exactly, including whether the FK block lives in the same migration or a later consolidated section of `ArchLucid.sql`).

Add the identical idempotent DDL block to `ArchLucid.Persistence/Scripts/ArchLucid.sql` in the appropriate location (check whether the file is organized alphabetically, by subsystem, or by creation order, and insert consistent with whatever ordering convention already exists — do not just append at the end unless that is in fact the existing convention).

## 3. Repository

Follow the "per-run coordinator artifact" pattern used by `IAgentExecutionTraceRepository` / `AgentExecutionTraceRepository` / `InMemoryAgentExecutionTraceRepository` (find these three files first and use them as the direct template for namespace, DI lifetime, and Dapper style).

1. `ITechnologyLedgerRepository` interface with:
   - `Task AddAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)`
   - `Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(ScopeContext scope, string runId, CancellationToken cancellationToken = default)` — match whatever scoping parameter shape `IAgentExecutionTraceRepository.GetByRunIdAsync` actually uses; if it does not take a `ScopeContext`, do not invent one — mirror the real signature.
   - `Task UpdateAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)` (full-row update, used by later prompts for status/lock changes — not called by anything yet)

2. `TechnologyLedgerRepository` — Dapper SQL implementation. Match the exact style of `AgentExecutionTraceRepository.cs`: primary constructor DI on `IDbConnectionFactory`, `[ExcludeFromCodeCoverage(Justification = "...")]` on the class if that's the sibling's convention, raw SQL as verbatim `"""..."""` strings, enum columns via `.ToString()`, RunId conversion via whatever helper the sibling uses for `UNIQUEIDENTIFIER` RunId columns (e.g. `RunChildRunScopeSql.ToSqlRunId(...)` if that's what `AgentExecutionTraceRepository` uses — check first, do not assume).

3. `InMemoryTechnologyLedgerRepository` — in-memory implementation for tests/no-SQL mode, matching `InMemoryAgentExecutionTraceRepository.cs`'s style exactly (thread-safety approach, storage structure).

4. Register both in DI following the exact pattern used for `IAgentExecutionTraceRepository` — find its registration lines in `ArchLucid.Host.Composition` (likely `ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` or wherever the explore step finds it) and add the ledger repository registration immediately alongside it, in both the in-memory and SQL registration paths.

Place the interface in whatever assembly/namespace `IAgentExecutionTraceRepository` actually lives in (verify the real path first — do not assume `ArchLucid.Core` vs `ArchLucid.Persistence`).

## 4. Tests

Match existing structure:

1. `ArchLucid.Contracts.Tests/Persistence/TechnologyLedger/TechnologyLedgerEntryTests.cs` — construction/property tests, null/empty-string guard tests for `RunId`/`TechnologyName`/`EntryId` if the contract type validates them, and an enum-values sanity test asserting the C# enum member names exactly match the SQL CHECK constraint literals listed above (compare `Enum.GetNames(typeof(TechnologyLedgerRole))` etc. against a hardcoded expected array in the test — this test exists specifically to catch future drift between the enum and the CHECK constraint).

2. Repository contract tests following the `AgentExecutionTraceRepositoryContractTests` pattern: an abstract base test class with `[Fact]`/`[SkippableFact]` tests for add-then-get-by-run-id round trip, multiple entries per run, and update; an `InMemoryTechnologyLedgerRepositoryContractTests : TechnologyLedgerRepositoryContractTests` concrete class. Only add a `SqlTechnologyLedgerRepositoryContractTests` variant if the sibling `AgentExecutionTraceRepositoryContractTests` SQL variant is easy to mirror without new SQL-container plumbing — if it requires new test collection/fixture setup beyond copy-paste, skip the SQL variant for now and note that in your report; the in-memory variant is sufficient for this additive step.

## 5. Verify

Run, one at a time (do not chain into a single background process; report each result before moving to the next):

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Contracts/ArchLucid.Contracts.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Persistence/ArchLucid.Persistence.csproj
```

Fix any compile errors before proceeding. Then run the new test classes specifically (not the full test suite) — use `dotnet test` filtered to the new test class names or the new test files' containing project, whichever is faster given the project's existing test-running conventions (check `docs/library/TEST_EXECUTION_MODEL.md` if unsure how tests are normally scoped in this repo).

## 6. Commit

Once compile and the new tests pass, stage only the files this prompt created (the four new contract files, the new migration file, the `ArchLucid.sql` edit, the new repository interface/implementation/in-memory files, the DI registration edit, and the new test files). Do not stage any other unrelated modified/untracked files already present in the working tree (the working tree may already contain unrelated in-progress changes from other work — leave them alone). Commit directly to `master` with a descriptive message (e.g. "Add Technology Ledger data model: contracts, table, repository (additive, unwired)"). Do not push to origin.

## 7. Report

Stop and report:
- The exact migration number used and why (what the prior highest number was).
- The final `ITechnologyLedgerRepository` signature and which existing repository you templated it from.
- Any place where you deviated from an assumption in this prompt because the actual sibling code looked different (e.g. different RunId scoping, different id-generation convention, different validation style) — call these out explicitly since later prompts will build on the shape you actually produced, not the shape assumed here.
- Test results (pass/fail counts) for the two compile checks and the new test classes.
- The commit hash.
- Confirm explicitly that nothing outside the new files was modified, and that no agent, prompt template, evidence builder, controller, or UI code was touched — this step must remain additive-only.
```

### Prompt 1 — Report (as actually run, 2026-07-07)

- **Migration number:** `269_TechnologyLedgerEntries.sql` (+ rollback `Migrations/Rollback/R269_TechnologyLedgerEntries.sql`). Prior highest was `268` (an `OAuthAuthMode`-suffixed migration); confirmed via `Glob` over `ArchLucid.Persistence/Migrations/*.sql` rather than assumed.
- **Final `ITechnologyLedgerRepository` signature** (namespace `ArchLucid.Persistence.Data.Repositories`, physically in `ArchLucid.Core/Persistence/ApplicationPorts/Data/Repositories/ITechnologyLedgerRepository.cs` — matching where `IAgentExecutionTraceRepository` actually lives):
  - `Task AddAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)`
  - `Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(ScopeContext scope, string runId, CancellationToken cancellationToken = default)`
  - `Task UpdateAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)`
  Templated directly from `IAgentExecutionTraceRepository` / `AgentExecutionTraceRepository` / `InMemoryAgentExecutionTraceRepository`.
- **Deviations from the prompt's assumptions:**
  1. `AgentExecutionTraceRepository` persists the whole entity as a JSON blob (`TraceJson`) plus a handful of queryable side-columns. `TechnologyLedgerEntries` deliberately uses **individual typed columns for every field instead of a JSON blob** — every field is small, and the table's entire purpose is to be directly queryable by the future `TechnologyConsistencyFindingEngine` (Prompt 6), e.g. `WHERE Role = 'PrimaryDatastore' AND ProviderFamily <> 'Azure'`. This was a deliberate design choice, not an oversight — flagging it since it means the repository shape looks different from its template despite following the same DI/Dapper conventions.
  2. Because there's no JSON blob, `GetByRunIdAsync` needs a Dapper row-shape class to map string enum columns back to typed enums. Per the workspace's "each class must be in its own file" rule, this row-shape (`TechnologyLedgerEntryRow`) is its own file (`ArchLucid.Persistence/Data/Repositories/TechnologyLedgerEntryRow.cs`), not a nested private class as might be the more common ad-hoc pattern for this kind of Dapper helper.
  3. RunId scoping, id generation (`Guid.NewGuid().ToString("N")` default on the property), and the no-hard-FK-to-`dbo.Runs` convention all matched the `AgentExecutionTraceRepository` template exactly — no deviation there.
  4. Skipped the SQL-backed repository contract test variant, per the prompt's own allowance — mirroring `AgentExecutionTraceRepositoryContractTests`' SQL variant would need new SQL-container fixture plumbing beyond copy-paste. Only `InMemoryTechnologyLedgerRepositoryContractTests` was added.
- **Test results:**
  - `agent-compile-check.ps1`: `ArchLucid.Contracts` — 0 errors; `ArchLucid.Core` — 0 errors; `ArchLucid.Persistence` — 0 errors; `ArchLucid.Host.Composition` — 0 errors (needed a 300s timeout instead of the default, purely due to the breadth of that project's dependency graph — no actual compile problem); `ArchLucid.Contracts.Tests` — 0 errors.
  - `ArchLucid.Contracts.Tests` (`TechnologyLedgerEntryTests`): **6/6 passed**.
  - `ArchLucid.Persistence.Tests` (`InMemoryTechnologyLedgerRepositoryContractTests`): **4/4 passed**.
- **Commit hash:** `daaa784505` — **and pushed to `origin/master`** (`00849cfb28..daaa784505`), because the owner explicitly asked to push when running this prompt. This is a one-time exception to this doc's stated default workflow ("local commits only ... do not push unless explicitly requested"); Prompt 2 onward reverts to local-commit-only unless push is requested again.
- **Scope confirmation:** nothing outside the files listed in the commit was modified. No agent, prompt template, evidence builder, controller, or UI code was touched — this step remained additive-only as intended.

---

## Prompt 2 — Wire the Technology Ledger into intake (required target-cloud question, honest projection, seed user-source entries)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root cause 1 (no canonical technology record) and root cause 2 (silent Azure/None default), §D fix 2, and §F (validation model). Also read "Prompt 1 — Report" in this same file (docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_IMPLEMENTATION_PROMPTS_2026_07_07.md) for the actual Technology Ledger shape this prompt builds on — do not re-derive it from the assessment's original (pre-implementation) description.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Close the two intake-side root causes from the assessment: (1) `DraftRequestProjector.Project()` currently hardcodes `CloudProvider = CloudProvider.None` on every draft-sourced `ArchitectureRequest` regardless of what the user actually said, and (2) nothing in the Socratic intake flow ever asks the user to state a target cloud (or explicitly cloud-neutral) posture, so there is no honest signal to project in the first place. This prompt adds a required intake question, fixes the projector to read it instead of hardcoding a default, and seeds one Technology Ledger entry (source: User) from the resulting `ArchitectureRequest.CloudProvider` whenever a run is created — for every intake path (draft wizard, direct API, CLI), not just drafts.

This does NOT wire the ledger into any agent, prompt template, or validation engine yet (that is Prompts 4 and 6). It also does NOT seed `source: evidence` entries from uploaded IaC/inventory documents (that is Prompt 3). Keep this prompt scoped to intake + seeding from the request's own `CloudProvider` field.

## 1. Add a new MUST-tier intake question

Read `ArchLucid.Application/Drafts/QuestionSelection/UniversalIntakeQuestions.cs` — it holds the canonical list of L0 MUST questions (`ElicitationQuestionSource.L0Universal`) that the Socratic wizard always asks. Add one more entry to `UniversalIntakeQuestions.MustQuestions`:

- `QuestionKey = "l0.pillar.cloud-target"`
- `Prompt = "Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?"` (adjust wording only if needed for consistency with the other five prompts' tone; keep it a single sentence)
- `Tier = ElicitationQuestionTier.Must`
- `AnswerKind = ElicitationAnswerKind.Enum` (this is the one existing `ElicitationAnswerKind` value not currently used anywhere in `UniversalIntakeQuestions` — confirm by reading `ArchLucid.Contracts/Governance/ElicitationAnswerKind.cs` that `Enum` means "one value from a bounded set; the allowed values are supplied out-of-band by the pack," which is exactly this case)
- `Source = ElicitationQuestionSource.L0Universal`

Do not add a `RuleKeys` value — the five sibling MUST questions don't set one either; check this before assuming.

The **only valid answer strings** for this question, stored verbatim in `DraftRequestDocument.QuestionAnswers["l0.pillar.cloud-target"]`, are the exact C# member names of `ArchLucid.Contracts.Common.CloudProvider`: `"None"`, `"Azure"`, `"Aws"`, `"Gcp"`. This is deliberate — the answer string must round-trip through `Enum.Parse<CloudProvider>` with no fuzzy text matching, which is only possible because step 2 below replaces free-text entry with a fixed choice control for this one question. Document this constraint with an XML doc comment (or a code comment directly above the new list entry, matching whatever comment convention the file already uses, if any) so a future editor doesn't accidentally add this question elsewhere as free text.

## 2. Render this one question as a bounded choice, not free text

Currently every intake question — regardless of `AnswerKind` — renders as a free-text `<Textarea>` in `archlucid-ui/src/components/draft-intake/DraftIntakeRequiredClarificationField.tsx`. Read that file and its test file (`DraftIntakeRequiredClarificationField.test.tsx`) first.

Add a narrowly-scoped branch: when `props.question.questionKey === "l0.pillar.cloud-target"` (define this as a named constant — check whether the codebase already has a shared constants file for well-known question keys under `archlucid-ui/src/lib` or similar; if not, a local exported const in this component file is fine), render a `<Select>` (from `archlucid-ui/src/components/ui/select.tsx` — read it first for its exact API/props) with exactly four options instead of the `<Textarea>`:

- value `"None"`, label `"Cloud-neutral (no specific provider)"`
- value `"Azure"`, label `"Microsoft Azure"`
- value `"Aws"`, label `"Amazon Web Services (AWS)"`
- value `"Gcp"`, label `"Google Cloud (GCP)"`

Wire the `<Select>`'s `onChange`/`onValueChange` (check the component's actual prop name) to call `props.onAnswerChange(props.question.questionKey, value)` exactly like the existing `<Textarea>` does, so nothing else about the save/skip/continue flow needs to change. Do not build a generic `AnswerKind`-driven renderer for all question kinds — that is explicitly out of scope here; this is a single hardcoded branch for one well-known question key so the change stays small and reviewable. Give the control an accessible label (`aria-label={props.question.prompt}`, matching the existing `Textarea`) per `.cursor/rules/UI-Accessibility-Baseline.mdc`, and keep styling consistent with `.cursor/rules/UI-Enterprise-Design-Standard.mdc` (neutral surfaces, no ad-hoc pastel fills — the existing `Select` component's default styling should already comply; do not add custom color classes).

Update `canSaveAndContinue` computation in `SocraticIntakeWizard.tsx` if it currently relies on `.trim().length > 0` in a way that already works for a non-empty `Select` value (it likely does, since a selected enum value is a non-empty string) — verify rather than assume, and only change it if the existing check would actually reject a valid selection.

Add/update tests in `DraftIntakeRequiredClarificationField.test.tsx` covering: the new question key renders a `Select` with the four options instead of a `Textarea`, and selecting an option calls `onAnswerChange` with the exact enum-name string. Add a similar assertion in whatever test file already covers `SocraticIntakeWizard.tsx` end-to-end if one exists and is easy to extend — check first.

## 3. Fix `DraftRequestProjector` to read the real answer

Read `ArchLucid.Application/Drafts/DraftRequestProjector.cs` in full — line `CloudProvider = CloudProvider.None,` inside `Project()` is the exact silent-default bug described in the assessment.

Replace the hardcoded value with a small private static method, e.g. `ResolveCloudProvider(DraftRequestDocument document)`, that:
- Looks up `document.QuestionAnswers["l0.pillar.cloud-target"]` (case-insensitive key lookup; `QuestionAnswers` is already declared `StringComparer.OrdinalIgnoreCase` so a plain indexer/`TryGetValue` is fine).
- Returns `Enum.Parse<CloudProvider>(answer, ignoreCase: true)` when the answer is present and matches one of the four valid names.
- Falls back to `CloudProvider.None` when the answer is missing (the question was skipped — see `TransparencyTrail.Skipped` handling in `DraftRequestService.EnsureMustQuestionsAnswered`, which already allows MUST questions to be explicitly skipped instead of answered) or fails to parse (defensive — should not happen once step 1/2 are in place, but do not throw here; a malformed historical draft should not crash submission).

Add an XML doc comment on the new method explaining that `None` here can mean either "user explicitly chose cloud-neutral" or "question was skipped" — those two cases are intentionally indistinguishable at this layer (the transparency trail already records which one happened; this method only produces the pipeline-facing `CloudProvider` value) — and that this is why ledger seeding in step 4 always records what actually landed on the request, not a reconstructed "was this a real answer" flag.

Add/update unit tests in whatever test file already covers `DraftRequestProjector` (search for one before assuming it doesn't exist) covering: answer `"Azure"` projects `CloudProvider.Azure`; answer `"Aws"` projects `CloudProvider.Aws`; answer `"Gcp"` projects `CloudProvider.Gcp`; answer `"None"` projects `CloudProvider.None`; missing/skipped answer projects `CloudProvider.None`; a garbage/legacy answer string projects `CloudProvider.None` without throwing.

## 4. Seed a Technology Ledger entry when a run is created

This is the "seed source: user ledger entries from ArchitectureRequest" half of fix D.2. It must run for **every** run-creation path, not just draft-sourced requests, because direct API/CLI callers set `ArchitectureRequest.CloudProvider` directly and never go through the Socratic wizard at all.

Read `ArchLucid.Application/Runs/Orchestration/ArchitectureRunCreateOrchestrator.cs` in full. The method `TryRecordArchitectureRunMeteringAsync`, called near the end of `FinalizeSuccessfulCreateRunAsync` (after the early-return idempotency-race branch, so it only runs on genuine first-time creation, never on idempotent replay), is the pattern to follow: a best-effort, non-transactional, swallow-and-log-on-failure post-commit step that runs once the run row is durably committed.

1. Create a small new class (its own file, per the workspace's one-class-per-file rule) — e.g. `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerRequestSeeder.cs` with an interface `ITechnologyLedgerRequestSeeder` (or, if sibling steps like the metering call are not abstracted behind an interface and are just plain methods on the orchestrator, follow that simpler convention instead — check first; do not add an interface if nothing else in this file uses one for a similarly-sized post-commit step). Its single responsibility: given a `runId` and an `ArchitectureRequest`, build one `TechnologyLedgerEntry` with:
   - `RunId = runId`
   - `Role = TechnologyLedgerRole.CloudPlatform`
   - `TechnologyName` = a human string for the provider (`"Microsoft Azure"`, `"Amazon Web Services"`, `"Google Cloud Platform"`, or `"Cloud-neutral (no specific provider)"` for `None`)
   - `ProviderFamily = request.CloudProvider`
   - `Status = TechnologyLedgerStatus.Chosen`
   - `Source = TechnologyLedgerSource.User`
   - `Rationale` = `"Explicit answer to the required target-cloud intake question."` when `request.RequestSource == "draft-intake"`, otherwise `"Directly specified on ArchitectureRequest.CloudProvider by the request source."`
   - `IsLocked = false`
   - `CreatedUtc` / `UpdatedUtc` = current time from whatever `TimeProvider`/clock convention `ArchitectureRunCreateOrchestrator` already uses (it has a `TimeProvider timeProvider` field — reuse it, do not call `DateTime.UtcNow` directly if the class already avoids that)
   and persist it via `ITechnologyLedgerRepository.AddAsync`.

2. Inject `ITechnologyLedgerRepository` (already DI-registered by Prompt 1) into `ArchitectureRunCreateOrchestrator`'s primary constructor, and call the new seeder from `FinalizeSuccessfulCreateRunAsync` in the same best-effort try/catch style as `TryRecordArchitectureRunMeteringAsync` (log a warning and continue on failure — a ledger-seeding failure must never fail run creation). Do not add a transactional overload to `ITechnologyLedgerRepository.AddAsync` for this — that scope is deliberately deferred; this seeding step is intentionally best-effort and outside the `PersistCreateRunRowsAsync` transaction, matching the audit-log and metering calls it sits next to.

3. Seed exactly one ledger entry per run, unconditionally (including when `ProviderFamily` ends up `None`) — an explicit `None` entry is itself meaningful signal ("a run exists with no cloud platform recorded from intake"), and recording it consistently is what later prompts (6, the deterministic consistency-finding engine) will depend on to distinguish "checked, cloud-neutral" from "never checked."

## 5. Tests

- Unit tests for the new seeder class (or method) covering: builds the correct `TechnologyLedgerEntry` for each of the four `CloudProvider` values, and picks the correct `Rationale` string based on `RequestSource`.
- An integration-style test on `ArchitectureRunCreateOrchestrator` (check for an existing test file first, e.g. `ArchLucid.Application.Tests/Orchestration/ArchitectureRunCreateOrchestrator*Tests.cs`, and add to the most relevant one rather than creating a parallel test file) asserting that after a successful `CreateRunAsync`, `ITechnologyLedgerRepository.GetByRunIdAsync` returns exactly one `CloudPlatform` entry matching the request's `CloudProvider`. Use the in-memory repository from Prompt 1 in this test's DI setup rather than mocking `ITechnologyLedgerRepository`, if the existing test class's DI/fixture pattern makes that easy; mock it only if that's how the sibling tests in the same file already handle comparable dependencies.
- Confirm (with a test or by inspection, and state which in your report) that the idempotent-replay path (`RehydrateCreateRunResultAsync`) does **not** call the seeder and therefore does not duplicate ledger entries on replay.

## 6. Verify

Run, one at a time (do not chain into a single background process; report each result before moving to the next):

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Contracts/ArchLucid.Contracts.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
```

Fix any compile errors before proceeding. Then run the new/updated .NET test classes specifically (`DraftRequestProjector` tests, the new seeder tests, the `ArchitectureRunCreateOrchestrator` ledger test). Separately, for the UI change, run the relevant Vitest file(s) for `DraftIntakeRequiredClarificationField` (and `SocraticIntakeWizard` if updated) from `archlucid-ui/` — check `package.json` for the exact test-runner script/invocation rather than assuming `npm test` takes a file-path filter the same way `dotnet test` does.

## 7. Commit

Once compile and the new/updated tests pass, stage only the files this prompt touched: `UniversalIntakeQuestions.cs`, `DraftIntakeRequiredClarificationField.tsx` (+ its test file), `SocraticIntakeWizard.tsx` only if actually changed, `DraftRequestProjector.cs` (+ its test file), the new seeder class file (+ its test file), `ArchitectureRunCreateOrchestrator.cs`, and any `ArchitectureRunCreateOrchestrator` test file you extended. Do not stage any other unrelated modified/untracked files already present in the working tree. Commit directly to `master` with a descriptive message (e.g. "Wire Technology Ledger into intake: required target-cloud question, honest CloudProvider projection, seed user-source ledger entries"). Do not push to origin unless explicitly asked again — Prompt 1's push was a one-time exception per this doc's stated workflow.

## 8. Report

Stop and report:
- The exact wording used for the new question prompt and the four `<Select>` option labels, and where the well-known question-key constant lives.
- The final signature/location of the ledger-seeding class or method, and whether you added an interface for it or followed a simpler existing convention — call out which sibling code you templated it from.
- Confirmation of how `DraftRequestProjector.ResolveCloudProvider` (or whatever you named it) behaves for: explicit answer, skipped MUST question, and a malformed/legacy answer string.
- Confirmation that the idempotent-replay path does not duplicate ledger entries, and how you verified that (test or inspection).
- Any place where you deviated from an assumption in this prompt because the actual sibling code (the `Select` component API, the orchestrator's existing best-effort-step convention, the test file layout) looked different — call these out explicitly, the same way Prompt 1's report did.
- Test results (pass/fail counts) for both compile checks, the .NET test classes, and the Vitest file(s).
- The commit hash.
- Confirm explicitly that no agent, prompt template, evidence builder, `TechnologyConsistencyFindingEngine`-style validation, or the Technology Baseline UI panel (Prompts 3–11) were touched — this step is scoped to intake + seeding only.
```

### Prompt 2 — Report (as actually run, 2026-07-07)

- **Question prompt:** `"Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?"` (`l0.pillar.cloud-target`, `ElicitationAnswerKind.Enum`).
- **Select option labels:** Cloud-neutral (no specific provider) → `None`; Microsoft Azure → `Azure`; Amazon Web Services (AWS) → `Aws`; Google Cloud (GCP) → `Gcp`. Question-key constant: `DraftIntakeQuestionKeys.CloudTarget` (C#) and exported `CLOUD_TARGET_QUESTION_KEY` (UI component).
- **Ledger seeder:** `TechnologyLedgerRequestSeeder` in `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerRequestSeeder.cs` — no interface (matches inline `TryRecordArchitectureRunMeteringAsync` pattern on the orchestrator). Static `BuildCloudPlatformEntry` for tests; instance `SeedAsync` persists via `ITechnologyLedgerRepository.AddAsync`. Registered in DI as `services.AddScoped<TechnologyLedgerRequestSeeder>()`.
- **`ResolveCloudProvider` behavior:** explicit enum-name answers round-trip; missing/skipped/malformed answers fall back to `CloudProvider.None` without throwing.
- **Idempotent replay:** `TryReplayFromIdempotencyAsync` returns before `FinalizeSuccessfulCreateRunAsync`; verified by `CreateRunAsync_when_idempotent_replay_does_not_seed_ledger_entries` (ledger repo empty after replay).
- **Deviations:** Radix `<Select>` options are not in the DOM until the trigger is opened — UI test opens the combobox before asserting option `data-testid`s.
- **Test results:** `DraftRequestProjectorTests` + `TechnologyLedgerRequestSeederTests` + `ArchitectureRunCreateOrchestratorTechnologyLedgerSeedingTests` — **15/15 passed**; `DraftIntakeRequiredClarificationField.test.tsx` — **7/7 passed**.
- **Scope confirmation:** no agent, prompt template, evidence builder, validation engine, or Technology Baseline UI panel touched.

---

## Prompt 3 — Seed evidence-sourced Technology Ledger entries (IaC declarations + cloud inventory packages)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §D fix 1 (ledger), the workflow step 1 bullet ("IaC/inventory evidence uploads seed source: evidence rows"), and §F (evidence-or-provenance requirement). Also read "Prompt 1 — Report" and "Prompt 2 — Report" in this same file (docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_IMPLEMENTATION_PROMPTS_2026_07_07.md) for the actual ledger shape and seeding conventions already shipped — build on those, do not re-derive them.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompt 2 seeds one `source: User` / `status: Chosen` `CloudPlatform` row from `ArchitectureRequest.CloudProvider` on every successful run create. This prompt adds the **evidence half** of fix D.1/D.2 intake seeding: derive additional `TechnologyLedgerEntry` rows with `Source = TechnologyLedgerSource.Evidence` from:

1. **Infrastructure declarations** attached to the request (`ArchitectureRequest.InfrastructureDeclarations`) — the same payloads the `InfrastructureDeclarationConnector` already normalizes via `InfrastructureDeclarationsPayloadNormalizer` and the registered `IInfrastructureDeclarationParser` implementations (`json`, `terraform-show-json`, etc.).
2. **Cloud inventory ZIP packages** already linked to the run — **Azure** via `IAzureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync` (pattern already used in `ArchitectureRunAuthorityCoordination` for evidence-bundle metadata merge), and **AWS/GCP** via `CloudInventoryExtractorPackageRecord.RunId` rows in `dbo.CloudInventoryExtractorPackages` (today the repository interface only supports insert/download-by-id — you will add a provenance read path mirroring Azure).

This does NOT wire the ledger into agents, prompts, or validation (Prompts 4–6). It does NOT build the Technology Baseline UI (Prompt 10). It does NOT deeply parse every resource inside inventory ZIP bytes for Prompt 3 — manifest/provenance + IaC canonical objects are sufficient for v1 evidence seeding.

## 1. Evidence seeder class

Create `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerEvidenceSeeder.cs` (one class per file). Follow the same conventions as `TechnologyLedgerRequestSeeder.cs` from Prompt 2:

- Primary-constructor DI on its dependencies.
- A public static builder method per evidence source shape (for unit tests), plus an instance `SeedAsync(...)` that persists via `ITechnologyLedgerRepository.AddAsync`.
- No interface unless you find an existing sibling seeder interface (Prompt 2 did not add one — match that).

Dependencies (read the real types before wiring):

- `ITechnologyLedgerRepository`
- `IScopeContextProvider`
- `IAzureExtractorPackageRepository`
- `ICloudInventoryExtractorPackageRepository` (after you extend it in step 2)
- `InfrastructureDeclarationsPayloadNormalizer` (reuse the production normalizer from DI — do not re-register parsers ad hoc)
- `TimeProvider`

Public entry point signature (adjust only if a sibling pattern demands it):

`Task SeedAsync(string runId, ArchitectureRequest request, CancellationToken cancellationToken = default)`

## 2. Cloud inventory provenance read path (AWS/GCP gap)

Read `IAzureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync` and `AzureExtractorPackageProvenance` — this is the template.

`ICloudInventoryExtractorPackageRepository` currently has only `InsertAsync` and `TryGetDownloadByPackageIdAsync`. Add:

- A lightweight provenance DTO in `ArchLucid.Persistence.Models` (e.g. `CloudInventoryExtractorPackageProvenance`) with at least: `PackageId`, `CloudProvider`, `SchemaVersion`, `ScopeId`, `OriginalFileName`, `CreatedUtc`, `CollectionTimestampUtc` (nullable), and a static `FromRecord(CloudInventoryExtractorPackageRecord)` factory mirroring Azure's style.
- `Task<CloudInventoryExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(ScopeContext scope, Guid runId, CloudProvider cloudProvider, CancellationToken cancellationToken = default)` on the interface.
- SQL implementation in `SqlCloudInventoryExtractorPackageRepository` (latest row for tenant/workspace/project + `RunId` + provider, ordered by `CreatedUtc` desc).
- `NoOpCloudInventoryExtractorPackageRepository` returns null (match `NoOpAzureExtractorPackageRepository` behavior).

Do **not** add download-bytes to this provenance path — citations only need ids/metadata (same rationale as Azure provenance).

## 3. IaC → ledger mapping

Create a dedicated mapper class (its own file), e.g. `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerCanonicalObjectMapper.cs`, with static methods that turn `CanonicalObject` rows (from `ArchLucid.Contracts.Persistence.Context`) into zero or more `TechnologyLedgerEntry` **candidates** (not yet persisted).

Read the existing parsers/tests for real property keys:

- `JsonInfrastructureDeclarationParser` sets `Properties["resourceType"]`, optional `region`, `subtype`.
- `TerraformShowJsonInfrastructureDeclarationParser` sets `Properties["terraformType"]`, optional `providerName`, `tf.*` value copies.

Mapping rules (v1 — keep deterministic and conservative):

| Signal | Ledger role | TechnologyName | ProviderFamily inference |
| --- | --- | --- | --- |
| Terraform type or JSON `resourceType` matching primary datastore families (`azurerm_sql_*`, `azurerm_mssql_*`, `aws_db_instance`, `aws_rds_cluster`, `google_sql_database_instance`, json types `database`/`datastore`) | `PrimaryDatastore` | humanized resource type + object `Name` | prefix/`providerName` → `CloudProvider` (see below) |
| Identity-ish types (`azurerm_key_vault`, `aws_iam_*`, `google_*_service_account` if present, json `identity`) | `IdentityProvider` | same pattern | same |
| Messaging-ish types (`azurerm_servicebus_*`, `aws_sqs_*`, `aws_sns_*`, `google_pubsub_*`, json `messaging`) | `Messaging` | same pattern | same |
| Compute-ish types (`azurerm_*_web_app`, `aws_lambda_*`, `aws_eks_cluster`, `google_container_cluster`, json `compute`) | `ComputeRuntime` | same pattern | same |
| `Properties["region"]` or `tf.location` / `tf.region` when present | `Region` | region string | inferred provider |
| Declaration `Format` | `IacTarget` | `terraform-show-json` → `"Terraform"`; `json` → `"ArchLucid JSON infrastructure declaration"`; other supported formats → format string | `CloudProvider.None` |

`ProviderFamily` inference helper (single place, unit-tested):

- `terraformType` or `resourceType` starting with `azurerm_` / `azure` → `Azure`
- starting with `aws_` → `Aws`
- starting with `google_` / `gcp_` → `Gcp`
- `providerName` containing `azurerm` / `aws` / `google` as fallback
- otherwise `CloudProvider.None`

Each candidate entry must set:

- `Source = TechnologyLedgerSource.Evidence`
- `Status = TechnologyLedgerStatus.Chosen` (evidence is explicit for v1 seeding)
- `EvidenceRef` = `infrastructureDeclaration:{SourceId}` (use `CanonicalObject.SourceId`)
- `Rationale` = short fixed string citing declaration name/id
- `IsLocked = false`
- `RunId` + timestamps supplied by caller

**IaC ingestion steps inside the seeder:**

1. If `request.InfrastructureDeclarations` is empty, skip IaC mapping.
2. Build `InfrastructureDeclarationsPayload` the same way `InfrastructureDeclarationsPayloadExtractor` does (read that class — do not guess field names).
3. `await _normalizer.NormalizeAsync(payload, cancellationToken)` to get `CanonicalObject` rows (warnings are OK — do not fail seeding on parser warnings).
4. Map each canonical object to candidates via the mapper; apply merge policy (step 5) before `AddAsync`.

## 4. Inventory package → ledger mapping

After IaC candidates, query inventory provenance for the run (parse `runId` to `Guid` the same way other run-child repositories do — check `RunChildRunScopeSql.ToSqlRunId` / `TechnologyLedgerRepository` for the string↔guid convention already used in this codebase):

1. **Azure:** `TryGetLatestProvenanceByRunIdAsync(scope, runGuid, ct)` → when non-null, emit one `CloudPlatform` candidate:
   - `TechnologyName = "Microsoft Azure"`
   - `ProviderFamily = CloudProvider.Azure`
   - `EvidenceRef = "azureExtractorPackage:{PackageId:N}"`
   - `Rationale` referencing original file name when present
2. **AWS:** `TryGetLatestProvenanceByRunIdAsync(scope, runGuid, CloudProvider.Aws, ct)` → `CloudPlatform` candidate with `ProviderFamily = Aws`, `EvidenceRef = "cloudInventoryPackage:Aws:{PackageId:N}"`
3. **GCP:** same for `CloudProvider.Gcp`

Do not read ZIP bytes in the seeder — provenance row is enough for Prompt 3.

## 5. Merge policy with Prompt 2 user seeding

Prompt 2 **always** inserts a `CloudPlatform` / `Source: User` row before this seeder runs. Load existing rows first:

`IReadOnlyList<TechnologyLedgerEntry> existing = await _ledgerRepository.GetByRunIdAsync(scope, runId, cancellationToken);`

Rules (v1):

- **Per `TechnologyLedgerRole`, at most one `Chosen` entry** after seeding completes.
- When a candidate targets a role that already has a `Chosen` entry:
  - If `ProviderFamily` matches, **skip** (do not duplicate).
  - If `ProviderFamily` differs, insert **one** `Alternative` entry (`Source: Evidence`, `EvidenceRef` preserved) with rationale `"Evidence suggests {candidateProvider} while existing chosen entry is {existingProvider}."` — do not overwrite or delete the existing row.
- When the role slot is empty, insert the candidate as `Chosen`.
- Never throw on conflicts — always prefer skip/alternative insertion.

Call order in `ArchitectureRunCreateOrchestrator.FinalizeSuccessfulCreateRunAsync` (after idempotency early-return):

1. Existing `TrySeedTechnologyLedgerFromRequestAsync` (user / Prompt 2) — **leave in place, run first**
2. New `TrySeedTechnologyLedgerFromEvidenceAsync` — same best-effort try/catch/log pattern as metering and the user seeder; **must not run on idempotent replay** (same guard path as Prompt 2)

Register `TechnologyLedgerEvidenceSeeder` in DI next to `TechnologyLedgerRequestSeeder` in `ServiceCollectionExtensions.ApplicationPipeline.cs`.

## 6. Tests

Add focused unit tests (new files under `ArchLucid.Application.Tests/Orchestration/`):

1. `TechnologyLedgerCanonicalObjectMapperTests` — terraform + json canonical objects map to expected roles/provider families; unknown types produce no candidates.
2. `TechnologyLedgerEvidenceSeederTests` — 
   - IaC declarations on a request produce expected evidence rows (mock or inject real normalizer with real parser instances from tests, matching `InfrastructureDeclarationConnectorTests` style).
   - Azure/AWS/GCP provenance produces `CloudPlatform` evidence rows with correct `EvidenceRef`.
   - When a user `CloudPlatform` row already exists, conflicting evidence becomes `Alternative` not second `Chosen`.
3. Optional but preferred: extend `ArchitectureRunCreateOrchestratorTechnologyLedgerSeedingTests` (from Prompt 2) with one case where `InfrastructureDeclarations` on the request yields an evidence ledger row after create (in-memory ledger repo).

Update any `ArchitectureRunCreateOrchestrator` test constructors if you add a new orchestrator dependency (same pattern Prompt 2 used for `TechnologyLedgerRequestSeeder`).

Repository contract tests: if you add SQL provenance read, a small unit test on query mapping is enough; do not build new SQL-container fixtures unless an existing pattern is copy-paste trivial.

## 7. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Persistence/ArchLucid.Persistence.csproj
```

Then run only the new/updated test classes via `dotnet test` filter (not the full solution).

## 8. Commit

Stage only files this prompt touches (new seeder/mapper, repository interface + SQL/NoOp changes, orchestrator + DI, tests, and any small DTO additions). Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Seed Technology Ledger evidence entries from IaC declarations and cloud inventory packages"). Do not push unless explicitly requested.

## 9. Report

Stop and report:

- The final `TechnologyLedgerEvidenceSeeder` signature and merge-policy behavior for user-vs-evidence `CloudPlatform` conflicts.
- The new cloud-inventory provenance API shape and which Azure type you mirrored.
- The IaC mapping table as actually implemented (role detection rules and `EvidenceRef` format).
- Whether AWS/GCP packages without `RunId` at ingest time are skipped (expected) — state explicitly.
- Test pass/fail counts.
- Commit hash.
- Confirm no agent/prompt/validation/UI work was touched.
```

### Prompt 3 — Report (as actually run, 2026-07-08)

- **Evidence seeder:** `TechnologyLedgerEvidenceSeeder.SeedAsync(string runId, ArchitectureRequest request, CancellationToken cancellationToken = default)` in `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerEvidenceSeeder.cs`. Registered in DI as `services.AddScoped<TechnologyLedgerEvidenceSeeder>()`. Orchestrator calls `TrySeedTechnologyLedgerFromEvidenceAsync` immediately after `TrySeedTechnologyLedgerFromRequestAsync` inside `FinalizeSuccessfulCreateRunAsync` (same best-effort try/catch; skipped on idempotent replay).
- **Merge policy:** `TechnologyLedgerEvidenceMergePolicy.Resolve` — per role, at most one `Chosen` row; matching `ProviderFamily` on an existing `Chosen` row → skip; conflicting `ProviderFamily` → insert one `Alternative` evidence row with rationale `"Evidence suggests {candidate} while existing chosen entry is {existing}."`; empty role slot → insert candidate as `Chosen`. User `CloudPlatform` from Prompt 2 always wins as `Chosen`; conflicting inventory evidence becomes `Alternative`.
- **Cloud inventory provenance API:** `CloudInventoryExtractorPackageProvenance` + `ICloudInventoryExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync(ScopeContext, Guid runId, CloudProvider cloudProvider, CancellationToken)` — mirrors `AzureExtractorPackageProvenance` / `IAzureExtractorPackageRepository.TryGetLatestProvenanceByRunIdAsync`. SQL implementation selects latest row by tenant/workspace/project + `RunId` + provider ordered by `CreatedUtc` desc; `NoOp` returns null.
- **IaC mapping (implemented):** `TechnologyLedgerCanonicalObjectMapper` maps `CanonicalObject` rows from `InfrastructureDeclarationsPayloadNormalizer` plus per-declaration `IacTarget` rows. Role detection from `terraformType` / `resourceType` prefixes (datastore → `PrimaryDatastore`, identity → `IdentityProvider`, messaging → `Messaging`, compute → `ComputeRuntime`; json subtype aliases supported). `ProviderFamily` from `azurerm_`/`aws_`/`google_`/`gcp_` prefixes or `providerName` fallback. `EvidenceRef` = `infrastructureDeclaration:{SourceId}` for canonical objects; `IacTarget` uses declaration id. Inventory `CloudPlatform` rows: Azure `EvidenceRef` = `azureExtractorPackage:{PackageId:N}`; AWS/GCP = `cloudInventoryPackage:{Provider}:{PackageId:N}`.
- **AWS/GCP without `RunId`:** skipped — provenance query filters on `RunId`; packages ingested without a run link return no row (expected).
- **Test results:** `TechnologyLedgerCanonicalObjectMapperTests` + `TechnologyLedgerEvidenceMergePolicyTests` + `TechnologyLedgerEvidenceSeederTests` + `ArchitectureRunCreateOrchestratorTechnologyLedgerSeedingTests` — **16/16 passed**.
- **Scope confirmation:** no agent handlers, prompt templates, validation engine, or Technology Baseline UI touched.

---

## Prompt 4 — Wire Technology Ledger into Topology agent (prompt injection + agent-proposed ledger rows)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root cause 3 (Azure-first prompt default), root cause 4 (agents do not share a canonical technology record), §D fix 3 (first half — Topology only), §E step 2 (generation reads ledger; agent proposals become Assumed/AgentProposed), and §F (closed-world / lock semantics). Also read "Prompt 1 — Report", "Prompt 2 — Report", and "Prompt 3 — Report" in this same file for the actual ledger shape, seeding conventions, and merge policies already shipped — build on those, do not re-derive them.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompts 2–3 populate the Technology Ledger at run create (`source: User` and `source: Evidence`, mostly `status: Chosen`). This prompt closes the **Topology half** of fix D.3:

1. **Read** the ledger when composing the Topology agent prompt and starter task objective — replace the hard-coded "Design an initial **Azure** topology" default with ledger- and `CloudProvider`-aware wording.
2. **Write** ledger rows from the Topology agent's structured `ProposedChanges` output (`AgentTopologyProposal`) as `source: AgentProposed`, `status: Assumed` — so technology choices introduced by the model are tracked in the ledger instead of living only as untracked manifest deltas.

This does **NOT** share the ledger downstream to Cost/Compliance/Critic (Prompt 5). It does **NOT** add the closed-world / neutral-mode **system prompt template** clauses (Prompt 8). It does **NOT** build `TechnologyConsistencyFindingEngine` (Prompt 6), API routes (Prompt 9), or the Technology Baseline UI (Prompt 10). Keep scope to Topology read-path + Topology write-path only.

**Important ordering note (read before coding):** today `ArchitectureRunAuthorityCoordination.CreateRunAsync` calls `RunStarterTaskFactory.BuildStarterTasks` **before** `ArchitectureRunCreateOrchestrator.FinalizeSuccessfulCreateRunAsync` seeds the ledger (Prompts 2–3). Starter tasks are therefore created with objectives that cannot yet see seeded ledger rows. Fix this as part of step 1 — do not leave objectives permanently Azure-hardcoded while only patching the handler.

## 1. Relocate intake ledger seeding before starter-task construction

Read `ArchitectureRunAuthorityCoordination.CreateRunAsync`, `ArchitectureRunCreateOrchestrator.FinalizeSuccessfulCreateRunAsync`, and `AuthorityPipelineWorkProcessor` (deferred path that also calls `RunStarterTaskFactory.BuildStarterTasks`).

**Move** (not duplicate) the existing `TechnologyLedgerRequestSeeder` + `TechnologyLedgerEvidenceSeeder` invocations so they run **after the run id exists** and **before** `RunStarterTaskFactory.BuildStarterTasks`:

- Inject both seeders into `ArchitectureRunAuthorityCoordination` (primary constructor DI, same as orchestrator today).
- After `authorityRunOrchestrator.ExecuteAsync` returns and Azure extractor metadata is merged into the evidence bundle, but **before** `BuildStarterTasks`, call both seeders with the same best-effort try/catch/log pattern used in `TrySeedTechnologyLedgerFromRequestAsync` / `TrySeedTechnologyLedgerFromEvidenceAsync` on the orchestrator.
- **Remove** those two calls from `FinalizeSuccessfulCreateRunAsync` so rows are not inserted twice.
- For the **deferred** materialization path in `AuthorityPipelineWorkProcessor`, invoke the same two seeders (resolve from DI) before `BuildStarterTasks` there as well — deferred runs never went through the orchestrator finalize path at create time.

Ledger seeding remains **best-effort and outside the create-run transaction** (match Prompt 2 behavior). A seeding failure must not fail run creation or deferred task materialization.

## 2. Ledger-aware Topology task objective (`RunStarterTaskFactory`)

Read `RunStarterTaskFactory.BuildTopologyObjective` — it currently hardcodes `"Design an initial Azure topology..."`.

1. Add a small formatter class (its own file), e.g. `ArchLucid.Application/Runs/Coordination/TechnologyLedgerObjectiveComposer.cs`, with static methods:
   - `string BuildTopologyObjective(ArchitectureRequest request, IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)` — provider-neutral / AWS / GCP / Azure branches keyed off **ledger `CloudPlatform` `Chosen` row when present**, else `request.CloudProvider`. Never emit the word "Azure" when the effective target is `Aws`, `Gcp`, or explicit cloud-neutral (`None`).
   - Keep the system name, environment, and description suffixes from the current objective string.
2. Change `RunStarterTaskFactory.BuildStarterTasks` (and `CreateTopologyTask`) to accept `IReadOnlyList<TechnologyLedgerEntry> ledgerEntries` and pass them into the composer.
3. In `ArchitectureRunAuthorityCoordination`, after seeding, load ledger rows via `ITechnologyLedgerRepository.GetByRunIdAsync(scope, runId, ct)` and pass them into `BuildStarterTasks`.
4. Update `AuthorityPipelineWorkProcessor` deferred path the same way (seed → load → build tasks).
5. Update `RunStarterTaskFactoryTierTests` and any other direct callers.

Do **not** change Cost/Compliance/Critic objectives in this prompt.

## 3. Ledger context block in Topology user prompt

Read `TopologyAgentHandler.ExecuteAsync`, `AgentUserPromptComposer.BuildTopologyUserPrompt`, and `AgentUserPromptStaticPrefix.AppendTopology` (note: `AppendTopology` still adds Azure-specific "Important guidance" when `cloudProvider is Azure or None` — that is a separate hard-coded default this prompt must neutralize for Topology only).

1. Add `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerPromptFormatter.cs` (one class per file) with a static method, e.g. `AppendTechnologyLedgerContext(StringBuilder sb, IReadOnlyList<TechnologyLedgerEntry> entries)`, that renders a bounded, deterministic text block:
   - Section header, e.g. `"Technology Ledger (canonical baseline for this run):"`
   - One line per entry: `Role`, `TechnologyName`, `ProviderFamily`, `Status`, `Source`, optional `EvidenceRef`.
   - Sort by `Role` then `CreatedUtc` for stable output.
   - Cap at **32 lines**; if more entries exist, append a truncation note (do not silently drop without saying so).
   - Add a closing instruction line: agents must treat `Chosen` rows as authoritative, must label any **new** technology they introduce as an `Assumed` proposal, and must not substitute a different provider family's equivalent without explicitly proposing it.
2. Inject `ITechnologyLedgerRepository` and `IScopeContextProvider` into `TopologyAgentHandler` (primary constructor). After `BuildTopologyUserPrompt` and before the LLM call, load ledger rows for the run and append the formatter block to the user prompt string.
3. Adjust `AgentUserPromptStaticPrefix.AppendTopology` so Azure-specific "Important guidance" (App Service over AKS, etc.) is emitted **only when** the effective cloud target is `CloudProvider.Azure`. When `CloudProvider.None`, emit a short cloud-neutral MVP guidance block instead (no provider-specific service names). When `Aws` or `Gcp`, rely on the existing `CloudProviderAgentPromptComposer.AppendUserPromptCloudGuidance` branch and **do not** also append the Azure block. Read `CloudProviderAgentPromptComposer.cs` before editing — reuse its branching, do not fork a third copy of AWS/GCP wording.

Register nothing new for the formatter (static class). `TopologyAgentHandler` is already registered in DI.

## 4. Map Topology `ProposedChanges` → agent-proposed ledger rows

`AgentResult.ProposedChanges` (`AgentTopologyProposal`) remains the manifest wire contract — **do not remove or stop populating it**. This step **adds parallel ledger persistence** so technology roles are tracked.

### 4a. Mapper

Create `ArchLucid.Application/Runs/Orchestration/TechnologyLedgerTopologyProposalMapper.cs` (static mapper, own file). Read `AgentTopologyProposal`, `ManifestService`, `ManifestDatastore`, and `RuntimePlatformCloudFamily.ResolveCloudFamily`.

Mapping rules (v1 — conservative, deterministic):

| `ProposedChanges` signal | Ledger `Role` | `TechnologyName` | `ProviderFamily` |
| --- | --- | --- | --- |
| Each `AddedDatastores` row | `PrimaryDatastore` | `DatastoreName` (fallback `RuntimePlatform.ToString()`) | `RuntimePlatformCloudFamily.ResolveCloudFamily(datastore.RuntimePlatform)` |
| Each `AddedServices` row | `ComputeRuntime` | `ServiceName` (fallback `RuntimePlatform.ToString()`) | `RuntimePlatformCloudFamily.ResolveCloudFamily(service.RuntimePlatform)` |
| First non-empty `AzureArmRegion` across added services/datastores (if any) | `Region` | region string | same family as the row it came from |
| If proposal implies a cloud family and no `CloudPlatform` candidate yet | `CloudPlatform` | human label ("Microsoft Azure" / "Amazon Web Services" / "Google Cloud Platform") | inferred majority family from added nodes, else `request.CloudProvider` |

Every mapped candidate must set:

- `Source = TechnologyLedgerSource.AgentProposed`
- `Status = TechnologyLedgerStatus.Assumed` (per §E/§F — not `Chosen`)
- `EvidenceRef = "agentTopologyProposal:{ProposalId}:{stableSubKey}"` where `stableSubKey` disambiguates multiple services/datastores (e.g. service/datastore id or name slug)
- `Rationale = "Proposed by Topology agent in ProposedChanges."`
- `IsLocked = false`
- `RunId` + timestamps from caller

Skip `RequiredControls` / `Warnings` lists — those are not technology-role selections.

### 4b. Agent merge policy

Create `TechnologyLedgerAgentProposalMergePolicy.cs` (own file). Load existing rows first. Rules (v1):

- **Never** `UpdateAsync` or delete an existing row.
- **Never** insert a second `Chosen` for a role (agents cannot promote to `Chosen` in this prompt).
- If the role has **no** entries yet → insert candidate as `Assumed`.
- If the role already has a `Chosen` entry:
  - Same `ProviderFamily` → skip duplicate `Assumed` (return null).
  - Different `ProviderFamily` → still insert **one** `Assumed` row (multiple `Assumed` rows for conflicting proposals are OK for v1; do not downgrade the `Chosen` row).
- If `IsLocked == true` on the `Chosen` row for that role → skip inserting any agent proposal for that role (locked entries win).
- Reuse the style of `TechnologyLedgerEvidenceMergePolicy` but **do not** conflate evidence `Alternative` semantics with agent `Assumed` semantics — keep separate classes.

### 4c. Seeder + execute hook

Create `TechnologyLedgerTopologyProposalSeeder.cs` in `ArchLucid.Application/Runs/Orchestration/`:

`Task SeedFromTopologyResultAsync(string runId, ArchitectureRequest request, AgentResult topologyResult, CancellationToken cancellationToken = default)`

- No-op when `topologyResult.ProposedChanges` is null or all added-service/datastore lists are empty.
- Map → merge → `ITechnologyLedgerRepository.AddAsync` for each non-null resolved row.
- Register in DI: `services.AddScoped<TechnologyLedgerTopologyProposalSeeder>()` next to the other ledger seeders in `ServiceCollectionExtensions.ApplicationPipeline.cs`.

Wire into `ArchitectureRunExecuteOrchestrator` **after** `_agentResultPostExecutionEnricher.EnrichAsync` and **before** `PersistExecutePhaseAsync`, in a new best-effort private method `TrySeedTechnologyLedgerFromTopologyAsync` (same swallow/log pattern as create-run seeding). Only call it when the results list contains a `AgentType.Topology` result. Do **not** block persistence or fail the run when seeding fails.

## 5. Tests

Add focused unit tests under `ArchLucid.Application.Tests/Orchestration/` (and update handler tests only where constructor signatures change):

1. `TechnologyLedgerPromptFormatterTests` — stable ordering, truncation at 32 lines, includes `Chosen` vs `Assumed` labels.
2. `TechnologyLedgerTopologyProposalMapperTests` — sample `AgentTopologyProposal` maps to expected roles/provider families; empty proposal yields no candidates.
3. `TechnologyLedgerAgentProposalMergePolicyTests` — respects existing `Chosen`; skips duplicate same-family `Assumed`; skips when locked; inserts `Assumed` on provider conflict.
4. `TechnologyLedgerTopologyProposalSeederTests` — persists expected rows from a topology result (in-memory ledger repo).
5. `TechnologyLedgerObjectiveComposerTests` — Aws/Gcp/None/Azure objective strings; prefers ledger `CloudPlatform` `Chosen` over raw `request.CloudProvider` when they differ.
6. Update `TopologyAgentHandlerTests` (or add one test) asserting the composed user prompt contains the ledger section when the repository returns rows (mock `ITechnologyLedgerRepository`).
7. Extend `ArchitectureRunCreateOrchestratorTechnologyLedgerSeedingTests` or add a coordination test verifying ledger seeding happens **before** starter tasks are built and is **not** duplicated from finalize (inspect call order via existing mocks or a focused coordination unit test).

Update any test constructors that need the relocated seeders on `ArchitectureRunAuthorityCoordination`.

## 6. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj
```

Then run only the new/updated test classes via `dotnet test` filter (not the full solution). `TopologyAgentHandlerTests` may be included in the filter if updated.

## 7. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Wire Technology Ledger into Topology agent: ledger-aware objectives/prompts and agent-proposed rows from ProposedChanges"). Do not push unless explicitly requested.

## 8. Report

Stop and report:

- Where intake ledger seeding was relocated to (coordination vs orchestrator vs deferred processor) and confirmation that duplicate seeding was removed.
- The final `BuildTopologyObjective` behavior for each `CloudProvider` and when a ledger `CloudPlatform` `Chosen` row overrides `request.CloudProvider`.
- The Topology user-prompt injection point and whether Azure-specific static guidance is suppressed for non-Azure targets.
- The mapper table as actually implemented and the `EvidenceRef` format for agent-proposed rows.
- Agent merge-policy behavior for `Chosen` / `Locked` conflicts.
- The execute-orchestrator hook timing (after enricher, before persist).
- Test pass/fail counts.
- Commit hash.
- Confirm Cost/Compliance/Critic handlers, system prompt templates (Prompt 8), validation engine (Prompt 6), API/UI (Prompts 9–10) were **not** touched.
```

---

## Usage notes

- Each prompt assumes it starts fresh in Composer with no memory of prior conversation — that's why it restates the relevant assessment sections instead of referencing "our discussion."
- Prompt 1 is deliberately **inert**: it adds a data model nothing reads from or writes to yet, so it carries near-zero behavioral risk and can be reviewed purely as "does this compile, does this table look right, do these tests pass."
- After Prompt 1 lands, read its report before drafting Prompt 2 — the actual repository signature, id-generation convention, and any deviations it surfaces will shape how Prompt 2 (intake wiring) is written.
- If `master` has moved between running prompts, re-read the affected files before editing — the migration numbering step in particular depends on the actual current state of `ArchLucid.Persistence/Migrations/`.
- Per `.cursor/rules/Agent-Working-Tree-Safety.mdc`, each prompt should leave any pre-existing unrelated dirty working-tree changes untouched and unstaged.

### Local testability between prompts

Every prompt's own "Verify" step requires compile checks and scoped tests to pass before committing, so `master` should stay runnable after each step — restart `.\scripts\start-local-api-and-ui.ps1` (or just the API process) to pick up new DbUp migrations automatically; the local default `Mode: Simulator` (`ArchLucid.Api/appsettings.json`) makes agent-behavior prompts (4, 5, 7, 8) cheap to re-verify without live model calls.

| Prompt | Locally testable change |
| --- | --- |
| 1 | None visible — pure addition, smoke-test only ("does it still boot") |
| 2 | **Yes, meaningfully** — target-cloud question becomes required in `/reviews/new`; click through it |
| 3 | Invisible without inspecting the ledger table directly (no UI until Prompt 10) |
| 4–5 | Diff a sample greenfield review's generated topology/cost/compliance output before/after, in Simulator mode |
| 6 | Ships **warn-only** (see table above) specifically so existing sample/demo reviews keep committing while the rule set is tuned — do not let this prompt default to hard-blocking |
| 7–8 | Compare exported artifacts / narrative wording on a known run before/after |
| 9 | Testable directly against the API (curl / OpenAPI swagger) before any UI exists to call it |
| 10 | Directly testable via `npm run dev` / Playwright |
| 11 | CI-only, not app-interactive |

---

## Note: source assessment document was regenerated, not recovered (2026-07-07)

The source assessment (`ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md`, referenced throughout this file and by Prompt 1's own text) was present as an untracked file at the start of a later session but had disappeared from the working tree by the time Prompt 1 finished running — it was never committed, and no commit or command in the session that ran Prompt 1 deleted it. This implementation-prompts file itself was in the same state (untracked, missing) and was restored here from a pasted copy. The assessment document has since been **regenerated** (not recovered verbatim) from the conversation record — its severity rating and the exact wording of fixes D.8/D.10 in particular are reconstructed judgment calls; the code-evidence findings underlying §A are the same ones actually found in the original review. Both files should be committed promptly so this doesn't recur.
