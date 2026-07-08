> **Scope:** Copy-paste Composer/agent prompts implementing fix D.1–D.10 from the assessment below, run **one at a time directly against `master`**. Each prompt is self-contained (restates relevant context) so it can be run in a fresh Composer session with no prior chat history. Review the diff and test results after each prompt before starting the next.
>
> **Assessment date:** 2026-07-07
> **Source assessment:** [`ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md`](ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md) — read this first; it contains the full diagnosis, severity rating, root causes, and the fix D.1–D.10 priority order that these prompts implement. **Note (2026-07-07, evening):** the original assessment file disappeared from the working tree before it was committed (it was untracked). It has been **regenerated** (same date) from the conversation record rather than recovered byte-for-byte — see the regeneration note at the top of that file for what is reconstructed vs. verbatim.
>
> **Workflow (owner decision, 2026-07-07):** Prompts run **directly on `master`**, no feature branches, local commits only after each prompt's tests pass — do not push to `origin/master` unless explicitly requested. This mirrors the workflow already used for [`OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md`](OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md). **Exception:** for Prompt 1, the owner explicitly asked to push to `origin/master` as part of running it (2026-07-07); the default for Prompt 2 onward remains local-commit-only unless push is explicitly requested again.

# Architecture generation technology consistency — implementation prompts

**Status:** Prompt 9 **done** (see report below). Prompt 8 **done** (see report below). Prompt 7 **done** (`e7eca24395`). Prompt 6 **done** (`faf3500c6d`). Prompt 5 **done** (`e89ceffdfb`). Prompt 4 **done** (`80ad003d60`). Prompt 3 **done** (`c23ec43b4d`). Prompt 1 **done** (`daaa784505`). Prompt 2 **done** (`599b51c74a`) — see reports below.

Work directly on `master` for every prompt below. Confirm `git status` is clean of unrelated changes before starting each prompt; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

---

## Planned sequence (subject to revision after each step)

| # | Fix (from assessment §D) | Scope | Status |
| --- | --- | --- | --- |
| **1** | D.1 | Technology Ledger data model — contracts, SQL table, repository (additive only; nothing reads or writes it yet) | **Done** (`daaa784505`) |
| 2 | D.2 | Wire ledger into intake: required target-cloud/neutral question, fix `DraftRequestProjector`, seed `source: user` ledger entries from `ArchitectureRequest` | **Done** (see Prompt 2 report) |
| 3 | D.1 (cont.) | Seed `source: evidence` ledger entries from context connectors (IaC declarations, cloud inventory ZIP) | **Done** (see Prompt 3 report) |
| 4 | D.3 | Inject ledger into `TopologyAgentHandler` / `RunStarterTaskFactory` objectives; agent proposals become `source: agent-proposed` ledger entries instead of untracked `ProposedChanges` free text | **Done** (`80ad003d60`) |
| 5 | D.3 | Share ledger downstream to Cost/Compliance/Critic prompts (extend `StagedPriorAgentsSummary`) | **Done** (`e89ceffdfb`) |
| 6 | D.4 | `TechnologyConsistencyFindingEngine` — deterministic provider/database/identity/messaging/runtime mismatch detection, wired into `PreCommitGovernanceGate` **behind a warn-only/enforcing options toggle** (mirroring the existing `AgentOutputQualityGateOptions` enable/severity pattern) so it ships surfacing findings without blocking commits on existing sample/demo runs until explicitly flipped to enforcing | **Done** (see Prompt 6 report) |
| 7 | D.5 | Structured-first artifact synthesis — prose lint against ledger in `ArtifactSynthesisService` | **Done** (see Prompt 7 report) |
| 8 | D.6 | Prompt template updates — closed-world clause, neutral-mode clause, alternative-labeling clause across all four system prompt templates | **Done** (see Prompt 8 report) |
| 9 | D.7 | **API endpoint** — `GET`/`PATCH` ledger routes on the run so the UI has something to call (missing piece between the repository and the UI panel; not called out as its own fix in the assessment but required before step 10 can work) | **Done** (see Prompt 9 report) |
| 10 | D.7 | Technology Baseline UI panel + approval step (`archlucid-ui`), consuming the endpoint from step 9 | Not started |
| 11 | D.9 | Golden-corpus consistency scenarios in CI | Not started |

Prompts 1–9 are written out below. **Run Prompt 10** when ready (ask to draft if not yet written).

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

### Prompt 4 — Report (as actually run, 2026-07-08)

- **Intake seeding relocated to:** `ArchitectureRunAuthorityCoordination.CreateRunAsync` (after extractor merge, before `BuildStarterTasks`, skipped when deferred) and `AuthorityPipelineWorkProcessor` deferred materialization path (seed → load → build tasks). `ArchitectureRunCreateOrchestrator.FinalizeSuccessfulCreateRunAsync` does **not** seed the ledger (on master it never did; coordination now owns intake seeding).
- **Topology objective:** `TechnologyLedgerObjectiveComposer.BuildTopologyObjective` uses `TechnologyLedgerEffectiveCloudTarget.Resolve` — prefers ledger `CloudPlatform` `Chosen` row, else `request.CloudProvider`. Labels: Azure / AWS / GCP / cloud-neutral (never emits "Azure" for Aws/Gcp/None).
- **Topology user prompt:** `TopologyAgentHandler` loads ledger rows, appends `TechnologyLedgerPromptFormatter` (sorted by role + `CreatedUtc`, 32-line cap). Azure MVP guidance only when effective cloud is Azure; cloud-neutral block when `None`; Aws/Gcp rely on `CloudProviderAgentPromptComposer` only.
- **Agent-proposed rows:** `TechnologyLedgerTopologyProposalMapper.MapCandidates` maps `AddedDatastores` → `PrimaryDatastore`, `AddedServices` → `ComputeRuntime`, first `AzureArmRegion` → `Region`, inferred `CloudPlatform` when absent. `Source=AgentProposed`, `Status=Assumed`, `EvidenceRef=agentTopologyProposal:{ProposalId}:{stableSubKey}`, `Rationale="Proposed by Topology agent in ProposedChanges."`
- **Agent merge policy:** `TechnologyLedgerAgentProposalMergePolicy` — no updates/deletes; no second `Chosen`; skip when `Chosen` is locked or same `ProviderFamily`; insert one `Assumed` on provider conflict.
- **Execute hook:** `ArchitectureRunExecuteOrchestrator.TrySeedTechnologyLedgerFromTopologyAsync` after `_agentResultPostExecutionEnricher.EnrichAsync`, before `PersistExecutePhaseAsync` (best-effort).
- **Test results:** filtered `ArchLucid.Application.Tests` (`TechnologyLedger*`, coordination, create seeding, tier tests) — **36/36 passed**.
- **Scope confirmation:** Cost/Compliance/Critic handlers, system prompt templates (Prompt 8), `TechnologyConsistencyFindingEngine` (Prompt 6), API/UI (Prompts 9–10) **not** touched.

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

### Prompt 5 — Report (as actually run, 2026-07-08)

- **Downstream handlers:** `CostAgentHandler`, `ComplianceAgentHandler`, and `CriticAgentHandler` each inject `ITechnologyLedgerRepository`, load rows via `TechnologyLedgerUserPromptInjection.LoadAsync`, resolve `effectiveCloud` with `TechnologyLedgerEffectiveCloudTarget.Resolve`, apply `CloudProviderAgentPromptComposer.ApplySystemPromptAddendum` with `effectiveCloud`, and append `TechnologyLedgerPromptFormatter` after task objective/tools (before retail grounding on Cost, before static guidance on Compliance/Critic; Critic still renders staged prior-agent notes before objectives).
- **Shared helper:** `TechnologyLedgerUserPromptInjection` (AgentRuntime) centralizes load + append; `TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext` and `AppendLedgerEntryLines` added for staged-summary reuse.
- **Staged Critic summary:** `StagedPriorAgentsSummaryBuilder.CreateNote` accepts optional `ledgerEntries`; prepends `## Technology Ledger (snapshot at staged Critic boundary)` before agent sections; ledger content counts toward `SummaryMaxTotalChars` (same truncation/redaction path).
- **Staged execution wiring:** `ITechnologyLedgerRepository` added to `RealAgentExecutorExecutionDependencies` / `RealAgentExecutor` ctor; `RealAgentExecutorStagedCriticExecution` loads ledger after phase 1 and passes rows into `CreateNote`.
- **Test results:** `TechnologyLedgerPromptFormatter` — **4/4 passed**; scoped `ArchLucid.AgentRuntime.Tests` (handlers, staged summary, staged executor) — **25/25 passed**.
- **Commit:** `e89ceffdfb`
- **Scope confirmation:** Topology write-path/objectives/mappers, `TechnologyConsistencyFindingEngine` (Prompt 6), system templates (Prompt 8), API/UI (Prompts 9–10) **not** touched.

---

## Prompt 5 — Share Technology Ledger with Cost, Compliance, and Critic agents

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root cause 4 (agents do not share a canonical technology record), §D fix 3 (second half — downstream agents), §E step 2 (every agent reads the ledger before composing its prompt), and §F (closed-world / Chosen vs Assumed semantics). Also read "Prompt 4 — Report" in this same file for the ledger formatter, effective-cloud resolver, and Topology read-path already shipped — **reuse those helpers**, do not fork a second formatter or merge policy.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompt 4 wired the Technology Ledger into **Topology** (read path: objectives + user prompt; write path: agent-proposed rows from `ProposedChanges`). This prompt closes the **downstream half** of fix D.3:

1. **Read** the current ledger when composing **Cost**, **Compliance**, and **Critic** user prompts — same canonical baseline Topology already sees.
2. **Extend** `StagedPriorAgentsSummary` so staged Critic execution carries a ledger snapshot alongside the bounded prior-agent digest (assessment D.3 explicitly names this evidence path).

This is **read-path only** for downstream agents. Do **not** add agent-proposed ledger persistence from Cost/Compliance/Critic output (no new mappers/seeders). Do **not** change `RunStarterTaskFactory` objectives for Cost/Compliance/Critic (Prompt 4 deferred those). Do **not** edit system prompt templates (Prompt 8), `TechnologyConsistencyFindingEngine` (Prompt 6), API routes (Prompt 9), or the Technology Baseline UI (Prompt 10). Do **not** re-touch Topology handler/objective/mapper code except shared helpers you extract for reuse.

## Execution-order context (read before coding)

In the default quad-agent batch, Topology/Cost/Compliance/Critic run **in parallel**. At handler prompt time the ledger therefore contains **intake rows only** (`source: User`, `source: Evidence`) plus any rows persisted from a **prior** execute pass — not Topology `AgentProposed` rows from the same in-flight batch. That is expected; still inject whatever rows exist so Cost/Compliance do not invent a different provider family than the seeded baseline.

When `StagedCriticAgentOptions.StagedCriticEnabled` is true, phase-1 agents finish before Critic runs. The ledger loaded for Critic (and for the staged summary note) may then include Topology `AgentProposed` rows persisted at the end of the **previous** execute pass, but still not same-batch Topology output unless execute orchestration is re-run between phases (it is not today). Document this limitation in tests/comments only if needed; do not redesign batch execution in this prompt.

## 1. Reuse Prompt 4 ledger helpers (do not duplicate)

Read `TechnologyLedgerPromptFormatter`, `TechnologyLedgerEffectiveCloudTarget`, and `TopologyAgentHandler` (Prompt 4 wiring).

1. If helpful, add a small shared helper (one class per file), e.g. `ArchLucid.AgentRuntime/TechnologyLedgerUserPromptInjection.cs`, with a static method that:
   - loads ledger rows via `ITechnologyLedgerRepository.GetByRunIdAsync`
   - resolves `effectiveCloud` via `TechnologyLedgerEffectiveCloudTarget.Resolve(request, ledgerEntries)`
   - appends `TechnologyLedgerPromptFormatter.AppendTechnologyLedgerContext` to a `StringBuilder`
   - returns `(effectiveCloud, ledgerEntries)` for the caller
   Keep it thin — prefer calling existing Application-layer formatters over copying strings.

2. Optionally add `TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext(IReadOnlyList<TechnologyLedgerEntry> entries)` returning `string` (empty when no rows) so `StagedPriorAgentsSummaryBuilder` can embed the same block without duplicating `StringBuilder` glue. If you add it, unit-test it beside the existing formatter tests.

## 2. Cost / Compliance / Critic handlers — direct ledger injection

Read `CostAgentHandler`, `ComplianceAgentHandler`, and `CriticAgentHandler` (`BuildUserPrompt` / `ExecuteAsync`).

For **each** handler:

1. Inject `ITechnologyLedgerRepository` (primary constructor DI; handlers are already registered in `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`).
2. Before the LLM call, load ledger rows for the run (use `IScopeContextProvider` + `runId`, same as Topology).
3. Resolve `effectiveCloud = TechnologyLedgerEffectiveCloudTarget.Resolve(request, ledgerEntries)`.
4. Use `effectiveCloud` (not raw `request.CloudProvider`) when calling `CloudProviderAgentPromptComposer.ApplySystemPromptAddendum` for that handler's agent type.
5. Append the Technology Ledger context block to the user prompt **after** architecture request/evidence and **before** agent-specific guidance blocks (match Topology ordering: run header → request/evidence → task objective/tools → **ledger block** → cloud guidance → static guidance).

Handler-specific notes:

- **Cost:** keep `CostRetailGroundingBuilder.Build(request, evidence, …)` as-is unless you find a trivial, tested way to pass `effectiveCloud` into retail grounding without broad refactors — ledger block in the prompt is the required change.
- **Compliance:** do not rewrite the Azure-centric "Key Vault" static guidance list in this prompt (Prompt 8 owns template/guidance neutralization); only add ledger context + effective-cloud addendum.
- **Critic:** preserve existing `StagedPriorAgentsSummary` evidence-note rendering; append the ledger block in the handler as well (see §3 for how staged summary complements this).

Update handler unit tests (`CostAgentHandlerTests`, `ComplianceAgentHandlerTests`, `CriticAgentHandlerTests` or add focused tests) to mock `ITechnologyLedgerRepository` returning sample rows and assert the composed user prompt contains `Technology Ledger (canonical baseline for this run):`.

## 3. Extend `StagedPriorAgentsSummary` with ledger snapshot

Read `StagedPriorAgentsSummaryBuilder`, `RealAgentExecutorStagedCriticExecution`, and `EvidenceNoteTypes.StagedPriorAgentsSummary`.

1. Extend `StagedPriorAgentsSummaryBuilder.CreateNote` with an **optional** `IReadOnlyList<TechnologyLedgerEntry>? ledgerEntries = null` parameter (or add an overload — pick one public surface, keep backward-compatible call sites compiling).
2. When `ledgerEntries` is non-null and non-empty, prepend a section to the note body **before** the per-agent `## Topology` / `## Cost` sections:

   ```
   ## Technology Ledger (snapshot at staged Critic boundary)
   <same formatter output as handlers, including truncation rules>
   ```

   The ledger section counts toward `StagedCriticAgentOptions.SummaryMaxTotalChars` — truncate the combined body using the existing budget logic (do not bypass the cap).

3. Wire ledger loading into staged execution:
   - Add `ITechnologyLedgerRepository` to `RealAgentExecutorExecutionDependencies` (constructor + `RealAgentExecutor` composition root).
   - In `RealAgentExecutorStagedCriticExecution`, after phase 1 completes and before `StagedPriorAgentsSummaryBuilder.CreateNote`, load ledger rows for the run and pass them into `CreateNote`.

4. Extend `StagedPriorAgentsSummaryBuilderTests` (and `RealAgentExecutorStagedCriticTests` if there is an existing seam) to assert the staged note includes the ledger header when entries are supplied.

Do **not** introduce a new `EvidenceNoteTypes` value — the ledger block lives **inside** the existing `StagedPriorAgentsSummary` message body.

## 4. Tests

Add/update focused tests (do not run the full solution test suite):

1. `TechnologyLedgerPromptFormatterTests` — if you add `FormatTechnologyLedgerContext`, cover empty vs non-empty.
2. `CostAgentHandlerTests` / `ComplianceAgentHandlerTests` / `CriticAgentHandlerTests` — prompt contains ledger section when repository returns rows; effective cloud overrides `request.CloudProvider` for addendum when ledger `CloudPlatform` `Chosen` differs (mirror Topology test style).
3. `StagedPriorAgentsSummaryBuilderTests` — ledger section prepended, respects total char budget.
4. Update test constructor wiring anywhere handler arity changed (same pattern as Prompt 4 Topology tests).

## 5. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj
```

Then scoped tests only, e.g.:

```
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~TechnologyLedgerPromptFormatter"
dotnet test ArchLucid.AgentRuntime.Tests --filter "FullyQualifiedName~StagedPriorAgentsSummary|FullyQualifiedName~CostAgentHandler|FullyQualifiedName~ComplianceAgentHandler|FullyQualifiedName~CriticAgentHandler"
```

Adjust filters to match the test classes you add or touch.

## 6. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Share Technology Ledger with Cost/Compliance/Critic prompts and staged Critic summary"). Do not push unless explicitly requested.

## 7. Report

Stop and report:

- Which handlers now load the ledger and where the formatter block is inserted in each user prompt.
- How `effectiveCloud` is chosen for `CloudProviderAgentPromptComposer` on Cost/Compliance/Critic.
- How `StagedPriorAgentsSummary` embeds the ledger snapshot and how char budgets apply.
- Whether `RealAgentExecutorExecutionDependencies` gained `ITechnologyLedgerRepository` and where ledger rows are loaded in staged execution.
- Test pass/fail counts.
- Commit hash.
- Confirm Topology write-path, consistency engine (Prompt 6), system templates (Prompt 8), API/UI (Prompts 9–10) were **not** touched.
```

---

## Prompt 6 — `TechnologyConsistencyFindingEngine` (deterministic ledger validation at pre-commit)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root cause 5 (no deterministic validation between generation and commit), §D fix 4 (`TechnologyConsistencyFindingEngine`), §E step 3 (validation runs before commit), §F (uniqueness / closed-world / warn-then-enforce semantics), and §I acceptance criteria #1 and #3. Also read "Prompt 1 — Report", "Prompt 2 — Report", "Prompt 3 — Report", "Prompt 4 — Report", and "Prompt 5 — Report" in this same file for the ledger shape, seeding conventions, merge policies, and agent read-path already shipped — **build on those types and repositories**, do not fork a second ledger model.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompts 1–5 established and populated the Technology Ledger and wired it into agent prompts. This prompt closes fix **D.4** — the **deterministic validation gate** that runs **before commit**:

1. Implement `TechnologyConsistencyFindingEngine` — pure, ledger-driven checks for technology drift / inconsistency within a run.
2. Wire the engine into **`PreCommitGovernanceGate`** so consistency findings are merged with the persisted findings snapshot at evaluation time (commit path, dry-run simulation, and governance workflow entry points that already call the gate).
3. Ship behind a **warn-only default** (`Mode = WarnOnly`) mirroring `AgentOutputQualityGateOptions` posture so existing sample/demo runs keep committing while inconsistencies surface as warnings; allow an **Enforcing** mode that emits blockable severities once tuned.

This is **ledger-validation only** for v1. Do **not** parse agent JSON, golden-manifest resource names, or exported artifact prose (Prompt 7). Do **not** edit system prompt templates (Prompt 8), add API routes (Prompt 9), or build the Technology Baseline UI (Prompt 10). Do **not** re-touch Topology/Cost/Compliance/Critic handler prompt wiring (Prompt 5), ledger seeding (Prompts 2–3), or Topology agent-proposed persistence (Prompt 4) except shared ledger types/repos the engine reads.

## Execution-order context (read before coding)

- `PreCommitGovernanceGate` today loads findings from the persisted `FindingsSnapshot` (or preloaded data), then evaluates policy-pack assignments / global thresholds via `PreCommitGateEvaluator`. **Append** technology-consistency findings to that in-memory list **before** `PreCommitGateEvaluator` runs — same pattern as `SimulateSyntheticFindingsAsync`, but backed by real ledger rows instead of synthetic e7eca24395s.
- The engine runs at **commit evaluation time**, not during the parallel agent batch. It therefore sees the ledger as it exists **after** execute (including Topology `AgentProposed` rows persisted at end of execute when Prompt 4's seeder ran). That is the intended validation boundary.
- Default posture must remain **non-blocking**: warn-only findings use `FindingSeverity.Warning` and must not block commit unless the host explicitly configures enforcing mode **and** the pre-commit threshold/policy assignment would block that severity. Do **not** default to hard-blocking commits.

## 1. Options + mode enum (mirror quality-gate posture)

Read `ArchLucid.Core.Configuration.AgentOutputQualityGateOptions` and `AgentOutputQualityGateMode`.

Create under `ArchLucid.Core/Configuration/` (one type per file):

1. `TechnologyConsistencyFindingEngineMode.cs` — enum:
   - `WarnOnly` (default) — engine emits `FindingSeverity.Warning` findings; pre-commit gate may audit/warn but must not block solely on these unless an operator also configured a blocking threshold that includes Warning (today's default global threshold does not).
   - `Enforcing` — engine emits `FindingSeverity.Error` findings for the same rule violations so existing pre-commit severity thresholds can block commit when enabled.

2. `TechnologyConsistencyFindingEngineOptions.cs` — sealed options class:
   - `public const string SectionPath = "ArchLucid:TechnologyConsistency:FindingEngine";`
   - `bool Enabled` (default `true`)
   - `TechnologyConsistencyFindingEngineMode Mode` (default `WarnOnly`)
   - `void Normalize()` if needed (clamp nothing exotic; keep simple)

Bind in host composition (`ServiceCollectionExtensions` or existing options registration pattern) and add a documented default block to `ArchLucid.Api/appsettings.json`:

```json
"ArchLucid": {
  "TechnologyConsistency": {
    "FindingEngine": {
      "Enabled": true,
      "Mode": "WarnOnly"
    }
  }
}
```

Add focused options tests under `ArchLucid.Core.Tests/Configuration/` (defaults are warn-only + enabled).

## 2. `TechnologyConsistencyFindingEngine` (deterministic rules)

Create `ArchLucid.Application/Governance/TechnologyConsistencyFindingEngine.cs` (one class per file) and interface `ITechnologyConsistencyFindingEngine` in `ArchLucid.Contracts` only if an existing governance/engine interface pattern requires it; otherwise keep the interface beside the implementation in Application and register the concrete type in DI (match nearby governance services).

Public surface (suggested):

```csharp
IReadOnlyList<Finding> Evaluate(
    string runId,
    IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
    TechnologyConsistencyFindingEngineOptions options);
```

Implementation requirements:

- **Pure / deterministic** — no LLM calls, no I/O inside `Evaluate`; the gate loads ledger rows and passes them in.
- **Empty ledger** → return empty list (no findings).
- Map `options.Mode` to severity: `WarnOnly` → `FindingSeverity.Warning`; `Enforcing` → `FindingSeverity.Error`.
- Emit `ArchLucid.Contracts.Findings.Finding` rows using consistent metadata:
  - `FindingType = "TechnologyConsistency"`
  - `Category = "TechnologyLedger"`
  - `EngineType = "TechnologyConsistencyFindingEngine"`
  - `EnforcementTier = FindingEnforcementTier.PolicyViolation`
  - `RunIdRef = runId`
  - `Properties` should include at least: `technologyLedgerRole`, `providerFamily`, conflicting `entryId`(s) when applicable (use `FindingPropertyKeys` if a matching key exists; otherwise add well-named keys in `FindingPropertyKeys` only if necessary).
  - Use stable, machine-friendly `Title` strings (PascalCase tokens) for each rule id below — these become the operator-facing identifiers.

### v1 rules (implement all)

Operate on persisted ledger rows grouped by `TechnologyLedgerRole`. Only `TechnologyLedgerStatus.Chosen` rows are authoritative for cross-role checks; `Assumed` / `Alternative` / `Future` rows must **not** trigger cross-family mismatch findings in v1 (they may be referenced in rationale text only).

1. **`DuplicateChosenLedgerRole`** — for any role, more than one `Chosen` entry → one finding per role listing the conflicting entry ids / technology names.

2. **`ConflictingChosenProviderFamily`** — let `cloud =` the `Chosen` `CloudPlatform` row's `ProviderFamily` when present.
   - When `cloud` is `Azure`, `Aws`, or `Gcp`, any **other** role in `{ IdentityProvider, PrimaryDatastore, Messaging, ComputeRuntime }` with a `Chosen` row whose `ProviderFamily` is a **different** non-`None` hyperscaler family → finding (cite both roles and families).
   - When `cloud` is `None` (cloud-neutral posture), any `Chosen` row in those same roles with a non-`None` hyperscaler family → finding (`CloudNeutralProviderLeak` may reuse the same finding title or use a dedicated title — pick one rule id and document in tests).

3. **`MissingChosenCloudPlatform`** — when any `Chosen` row exists for a non-platform role in `{ IdentityProvider, PrimaryDatastore, Messaging, ComputeRuntime, Region, IacTarget }` but there is **no** `Chosen` `CloudPlatform` row → warning/error finding (intake/evidence should have seeded platform; this catches partial seeding).

4. **`LockedChosenOverriddenByAssumed`** — when a `Chosen` row has `IsLocked == true` and there exists an `Assumed` row for the **same** `TechnologyLedgerRole` with a different `ProviderFamily` or `TechnologyName` → finding (lock semantics from §F; detection only — no auto-repair).

Do **not** implement manifest/agent-output cross-checks in this prompt. Do **not** attempt to auto-mutate ledger rows.

Add `TechnologyConsistencyFindingEngineTests` under `ArchLucid.Application.Tests/Governance/` with table-driven cases for each rule, both modes, and empty ledger.

## 3. Wire into `PreCommitGovernanceGate`

Read `PreCommitGovernanceGate`, `PreCommitGateEvaluator`, and `AuthorityDrivenArchitectureRunCommitOrchestrator.EvaluatePreCommitGovernanceGateOrThrowAsync`.

1. Inject into `PreCommitGovernanceGate` primary constructor:
   - `ITechnologyLedgerRepository`
   - `ITechnologyConsistencyFindingEngine` (or concrete engine if no interface)
   - `IOptions<TechnologyConsistencyFindingEngineOptions>`

2. In `SimulateSyntheticFindingsInternalAsync`, **after** the findings list is loaded (from preload or findings snapshot) and **before** `PreCommitGateEvaluator` runs:
   - If `options.Enabled` is false → skip.
   - Load ledger rows: `await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken)` (use existing scope from gate).
   - `IReadOnlyList<Finding> consistencyFindings = _engine.Evaluate(runId, ledgerEntries, options.CurrentValue);`
   - Append to the mutable `findings` list.

3. Ensure all public `EvaluateAsync` overloads funnel through the same internal method so commit, golden-manifest, and preloaded-data paths all get consistency findings.

4. **Do not** persist consistency findings back to `FindingsSnapshot` in this prompt (no snapshot mutation). They are ephemeral at gate evaluation time plus whatever audit/logging the gate already emits for warn-only outcomes (`EmitPreCommitWarnedAuditAsync`). Prompt 10 UI may later read persisted findings; if you find a trivial, tested hook in findings generation to also surface warnings earlier, skip it unless it is < ~30 lines and covered by tests — not required.

Update `PreCommitGovernanceGateTests` (and any governance dry-run tests that construct the gate) with:
- Ledger rows that violate `ConflictingChosenProviderFamily` → gate returns warn-only (not blocked) in default `WarnOnly` mode.
- Same fixture with `Mode = Enforcing` and a blocking global threshold / assignment → gate blocks (mirror existing critical-finding tests).

Update test ctor wiring anywhere `PreCommitGovernanceGate` arity changed.

## 4. DI registration

Register in `ServiceCollectionExtensions.ApplicationPipeline.cs` (or the governance DI extension used by other gate services):

- `services.Configure<TechnologyConsistencyFindingEngineOptions>(configuration.GetSection(...))`
- `services.AddScoped<ITechnologyConsistencyFindingEngine, TechnologyConsistencyFindingEngine>()` (or `AddSingleton` if the engine is stateless — prefer scoped to match gate/repo lifetime).

## 5. Tests

Add/update focused tests (do not run the full solution test suite):

1. `TechnologyConsistencyFindingEngineTests` — each rule, both modes, empty ledger, multiple violations in one evaluate call.
2. `TechnologyConsistencyFindingEngineOptionsTests` — defaults.
3. `PreCommitGovernanceGateTests` — ledger-driven warn vs enforce paths (use in-memory ledger repo or mock `ITechnologyLedgerRepository`).

## 6. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Core/ArchLucid.Core.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
```

Then scoped tests only, e.g.:

```
dotnet test ArchLucid.Core.Tests --filter "FullyQualifiedName~TechnologyConsistencyFindingEngineOptions"
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~TechnologyConsistencyFindingEngine|FullyQualifiedName~PreCommitGovernanceGate"
```

Adjust filters to match the test classes you add or touch.

## 7. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Add TechnologyConsistencyFindingEngine and wire warn-only ledger checks into pre-commit gate"). Push only if explicitly requested.

## 8. Report

Stop and report:

- The exact v1 rules implemented and the machine-friendly `Title` for each.
- How `TechnologyConsistencyFindingEngineMode` maps to `FindingSeverity` and how warn-only vs enforcing interacts with `PreCommitGateEvaluator` / existing `WarnOnlySeverities`.
- Where ledger rows are loaded in `PreCommitGovernanceGate` and confirmation findings are **not** persisted to `FindingsSnapshot` in v1.
- Default `appsettings.json` posture (must be warn-only).
- Test pass/fail counts.
- Commit hash.
- Confirm agent handlers (Prompt 5), system templates (Prompt 8), artifact synthesis lint (Prompt 7), API/UI (Prompts 9–10) were **not** touched.
```

---

### Prompt 6 — Report (as actually run, 2026-07-08)

- **v1 rules (machine-friendly `Title`):** `DuplicateChosenLedgerRole`, `ConflictingChosenProviderFamily`, `CloudNeutralProviderLeak`, `MissingChosenCloudPlatform`, `LockedChosenOverriddenByAssumed`.
- **Severity mapping:** `TechnologyConsistencyFindingEngineMode.WarnOnly` → `FindingSeverity.Warning`; `Enforcing` → `FindingSeverity.Error`. Existing `PreCommitGateEvaluator` / `WarnOnlySeverities` / global threshold / policy-pack assignment logic applies unchanged — warn-only mode does not block unless a configured threshold includes Warning.
- **Pre-commit wiring:** `PreCommitGovernanceGate.AppendTechnologyConsistencyFindingsAsync` loads ledger rows via `ITechnologyLedgerRepository.GetByRunIdAsync` after snapshot findings are loaded (empty list when snapshot missing) and appends engine findings before `PreCommitGateEvaluator`. Findings are **not** persisted to `FindingsSnapshot` in v1.
- **Options / defaults:** `ArchLucid:TechnologyConsistency:FindingEngine` — `Enabled: true`, `Mode: WarnOnly` in `ArchLucid.Api/appsettings.json`.
- **Test results:** `TechnologyConsistencyFindingEngineOptions` — **2/2 passed**; scoped governance tests (`TechnologyConsistencyFindingEngine`, `PreCommitGovernanceGate`) — **34/34 passed**.
- **Commit:** `faf3500c6d`.
- **Scope confirmation:** agent handlers (Prompt 5), artifact synthesis lint (Prompt 7), system templates (Prompt 8), API/UI (Prompts 9–10) **not** touched.

---

## Prompt 7 — Technology Ledger prose lint in `ArtifactSynthesisService` (structured-first export validation)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root cause 5 (no validation between generation and buyer-facing export), §D fix 5 (structured-first artifact synthesis / prose lint against ledger), §E step 4 (synthesis lint before packaging), §F (closed-world generation constraint — technologies in output must be ledger-corroborated or explicitly alternative), and §I acceptance criteria #1 and #2. Also read "Prompt 1 — Report" through "Prompt 6 — Report" in this same file for the ledger shape, seeding conventions, pre-commit finding engine, and warn-only rollout posture already shipped — **build on those types**, do not fork a second ledger model or duplicate the pre-commit rule engine wholesale.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompts 1–6 established the Technology Ledger, wired it through intake and agents, and added deterministic **pre-commit** ledger checks (`TechnologyConsistencyFindingEngine`). This prompt closes fix **D.5** — **buyer-facing export validation**:

1. After generators produce the structured artifact bundle (manifest → markdown / diagram / inventory text), run a **pure, deterministic prose lint** against the ledger entries for the run.
2. Wire ledger rows into `ArtifactSynthesisService` from the authority pipeline (and replay rebuild path) without violating the `ArtifactSynthesis` → `Persistence` boundary.
3. Ship behind a **warn-only default** (`Mode = WarnOnly`) mirroring Prompt 6 / `AgentOutputQualityGateOptions` so existing sample/demo bundles keep synthesizing while drift is surfaced in the synthesis trace; allow **Enforcing** mode to fail synthesis when tuned.

This is **export prose lint only** for v1. Do **not** change generator templates to pull from the ledger (generators remain manifest-structured). Do **not** edit system prompt templates (Prompt 8), add API routes (Prompt 9), or build the Technology Baseline UI (Prompt 10). Do **not** re-touch `TechnologyConsistencyFindingEngine` / `PreCommitGovernanceGate` except shared options enums if you deliberately reuse them. Do **not** add `ArchLucid.Persistence` references to `ArchLucid.ArtifactSynthesis` (boundary test `ArtifactSynthesis_must_not_depend_on_Persistence` must keep passing).

## Execution-order context (read before coding)

- `ArtifactSynthesisService` today: invoke generators in deterministic order → `IArtifactBundleValidator.Validate` → return bundle. **Append** ledger lint **after** structural validation, **before** return.
- Synthesis runs in `AuthorityPipelineStagesExecutor` **after** manifest generation and **after** execute has persisted agent-proposed ledger rows — the lint therefore sees the same ledger snapshot the pre-commit gate will evaluate later.
- `ArchLucid.ArtifactSynthesis` may reference `ArchLucid.Contracts` (`TechnologyLedgerEntry`, `CloudProvider`) but **must not** call `ITechnologyLedgerRepository` directly. The **Application** / **Persistence** callers load ledger rows and pass them into synthesis.
- Default posture must remain **non-blocking**: warn-only lint records findings in `SynthesisTrace.Notes` and sets `ArtifactBundleStatus.Partial` (existing executor already audits partial bundles via `AuditEventTypes.ArtifactSynthesisPartial`). Enforcing mode throws and follows the existing `ArtifactSynthesisFailed` audit path.

## 1. Options (mirror Prompt 6 posture)

Read `TechnologyConsistencyFindingEngineOptions` / `TechnologyConsistencyFindingEngineMode` (Prompt 6).

Create under `ArchLucid.Core/Configuration/` (one type per file):

1. **Prefer reusing** `TechnologyConsistencyFindingEngineMode` (`WarnOnly`, `Enforcing`) for lint mode — do **not** add a third duplicate enum unless reuse creates awkward naming; if reused, document that both finding engine and artifact lint share the enum.

2. `TechnologyLedgerArtifactLintOptions.cs` — sealed options class:
   - `public const string SectionPath = "ArchLucid:TechnologyConsistency:ArtifactLint";`
   - `bool Enabled` (default `true`)
   - `TechnologyConsistencyFindingEngineMode Mode` (default `WarnOnly`)
   - `void Normalize()` if needed (keep simple)

Bind in host composition and add a documented default block to `ArchLucid.Api/appsettings.json` beside the existing `FindingEngine` block:

```json
"ArtifactLint": {
  "Enabled": true,
  "Mode": "WarnOnly"
}
```

Add focused options tests under `ArchLucid.Core.Tests/Configuration/` (defaults are warn-only + enabled).

## 2. Prose token catalog + linter (pure, in `ArchLucid.ArtifactSynthesis`)

Create one class per file under `ArchLucid.ArtifactSynthesis/Validation/` (or `Services/` if that matches nearby validators):

1. `TechnologyLedgerProseTokenCatalog.cs` — static, curated hyperscaler product / family phrases grouped by `CloudProvider` (`Azure`, `Aws`, `Gcp`). Keep the list **small but high-signal** for v1 (e.g. Azure: `Azure`, `App Service`, `Key Vault`, `Azure SQL`, `Cosmos DB`, `AKS`, `Entra ID`; AWS: `AWS`, `Amazon RDS`, `S3`, `Lambda`, `Cognito`, `DynamoDB`; GCP: `Google Cloud`, `GKE`, `Cloud Run`, `Firestore`, `Cloud SQL`, `Pub/Sub`). Use **word-boundary** matching (case-insensitive) to limit false positives.

2. `TechnologyLedgerArtifactLintFinding.cs` — simple DTO:
   - `string RuleId` (PascalCase, stable)
   - `string ArtifactType`
   - `string? ArtifactName`
   - `string Message`
   - `string? MatchedToken`

3. `ITechnologyLedgerArtifactLinter.cs` + `TechnologyLedgerArtifactLinter.cs` — public surface (suggested):

```csharp
IReadOnlyList<TechnologyLedgerArtifactLintFinding> Lint(
    ArtifactBundle bundle,
    IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
    TechnologyLedgerArtifactLintOptions options);
```

Implementation requirements:

- **Pure / deterministic** — no LLM, no I/O.
- **Empty ledger** → return empty list (no findings; lint is a no-op).
- Resolve authoritative cloud **from ledger only** for lint: the `Chosen` `TechnologyLedgerRole.CloudPlatform` row's `ProviderFamily`, else `CloudProvider.None` (synthesis has no `ArchitectureRequest`; do not reference `TechnologyLedgerEffectiveCloudTarget` from Application).
- Build a **ledger allowlist** of substrings from all ledger rows with `Status` in `{ Chosen, Assumed, Alternative }` using `TechnologyName` (case-insensitive contains checks are sufficient for v1).
- **Lint target artifact types** (scan `SynthesizedArtifact.Content`):
  - `ArtifactType.ArchitectureNarrative`
  - `ArtifactType.ReferenceArchitectureMarkdown`
  - `ArtifactType.MermaidDiagram`
  - `ArtifactType.TerraformAdvisory`
  - `ArtifactType.Inventory` (JSON text — scan string values)
  Skip purely structural / tabular types in v1 (`CostSummary`, `ComplianceMatrix`, `CoverageSummary`, `DiagramAst`, `UnresolvedIssuesReport`) unless you find an obvious, tested seam.

### v1 rules (implement all)

1. **`ProseHyperscalerFamilyMismatch`** — when authoritative cloud is `Azure`, `Aws`, or `Gcp`, any catalog token belonging to a **different** hyperscaler family in a lint-target artifact → finding (cite artifact type + matched token + expected family).

2. **`CloudNeutralProseProviderLeak`** — when authoritative cloud is `None`, any hyperscaler catalog token in a lint-target artifact → finding **unless** the token is a case-insensitive substring of some ledger `TechnologyName` on an `Assumed` or `Alternative` row with a matching `ProviderFamily`.

3. **`UnledgeredHyperscalerToken`** — any hyperscaler catalog token in a lint-target artifact that is **not** a case-insensitive substring of any ledger `TechnologyName` (any status) → finding **unless** the surrounding text (±80 characters) contains one of: `alternative`, `assumed`, `proposed`, `under consideration` (case-insensitive). This implements the closed-world / alternative-labeling slice of §F at export time without NLP.

Do **not** attempt manifest cross-equality checks (that is pre-commit's job). Do **not** mutate artifact content — detection + trace/throw only.

Add `TechnologyLedgerArtifactLinterTests` under `ArchLucid.ArtifactSynthesis.Tests/` with table-driven cases per rule, empty ledger, warn vs enforce application (see §4), and at least one multi-artifact bundle.

## 3. Wire into `ArtifactSynthesisService`

Read `ArtifactSynthesisService`, `IArtifactSynthesisService`, and all call sites (`AuthorityPipelineStagesExecutor`, `AuthorityReplayService`, tests, `TestArtifactSynthesisFactory`).

1. Extend `IArtifactSynthesisService` / implementation with an overload that accepts ledger rows, keeping the existing two-parameter method as a backward-compatible shim that passes an empty ledger list:

```csharp
Task<ArtifactBundle> SynthesizeAsync(
    ManifestDocument manifest,
    IReadOnlyList<TechnologyLedgerEntry> technologyLedgerEntries,
    CancellationToken ct);
```

2. Inject into `ArtifactSynthesisService` primary constructor:
   - `ITechnologyLedgerArtifactLinter`
   - `IOptions<TechnologyLedgerArtifactLintOptions>` (or `IOptionsMonitor<>` if sibling services use monitor — match nearby artifact DI)

3. After `validator.Validate(bundle)` and before return:
   - If `options.Enabled` is false → skip.
   - `IReadOnlyList<TechnologyLedgerArtifactLintFinding> lintFindings = _linter.Lint(bundle, technologyLedgerEntries, options.CurrentValue);`
   - **WarnOnly:** for each finding, append `TechnologyLedgerArtifactLint[{RuleId}]: {Message} (artifact={ArtifactType}, token={MatchedToken})` to `bundle.Trace.Notes`; if any findings, set `bundle.Status = ArtifactBundleStatus.Partial`.
   - **Enforcing:** if any findings, throw `InvalidOperationException` aggregating rule ids + artifact types (match `ArtifactBundleValidator` throw style so the executor's existing `ArtifactSynthesisFailed` path fires).

4. Register linter + options in `ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` (artifact DI lives there today).

Update `ArtifactSynthesisServiceTests` to cover warn-only trace notes vs enforcing throw (mock linter or use real linter with fixture ledger).

## 4. Load ledger at call sites (Application / Persistence only)

1. **`AuthorityPipelineStagesExecutor`** — inject `ITechnologyLedgerRepository`. In the `authority.artifacts` stage, before `SynthesizeAsync`:
   - `IReadOnlyList<TechnologyLedgerEntry> ledgerEntries = await _technologyLedgerRepository.GetByRunIdAsync(scope, run.RunId.ToString(), token);` (match repository signature from Prompt 1).
   - Call `_artifactSynthesisService.SynthesizeAsync(ctx.Manifest!, ledgerEntries, token);`

2. **`AuthorityReplayService`** (`RebuildArtifacts` mode) — inject `ITechnologyLedgerRepository`, load rows for `request.RunId`, pass into `SynthesizeAsync` overload.

3. Update test doubles / mocks that implement or setup `IArtifactSynthesisService` for the new overload arity (`AuthorityPipelineStagesExecutorTests`, `AuthorityReplayServiceTests`, `TestArtifactSynthesisFactory`, any `ReturnsAsync` setups).

Do **not** change demo seed bundles unless a test fails — demo rows may not have ledger entries yet (lint no-ops on empty ledger).

## 5. Tests

Add/update focused tests (do not run the full solution test suite):

1. `TechnologyLedgerArtifactLintOptionsTests` — defaults.
2. `TechnologyLedgerArtifactLinterTests` — each rule, alternative-label exception, empty ledger.
3. `ArtifactSynthesisServiceTests` — lint wired: warn-only adds trace notes + `Partial` status; enforcing throws after validation.
4. `ArchLucid.Architecture.Tests` — confirm `ArtifactSynthesis_must_not_depend_on_Persistence` still passes (no new Persistence references in the synthesis project).

## 6. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Core/ArchLucid.Core.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
```

Then scoped tests only, e.g.:

```
dotnet test ArchLucid.Core.Tests --filter "FullyQualifiedName~TechnologyLedgerArtifactLintOptions"
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter "FullyQualifiedName~TechnologyLedgerArtifactLinter|FullyQualifiedName~ArtifactSynthesisService"
dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~ArtifactSynthesis_must_not_depend_on_Persistence"
```

Adjust filters to match the test classes you add or touch.

## 7. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Add Technology Ledger prose lint to artifact synthesis (warn-only default)"). Push only if explicitly requested.

## 8. Report

Stop and report:

- The exact v1 lint rules implemented and the machine-friendly `RuleId` for each.
- How warn-only vs enforcing affects `ArtifactBundle.Status`, `SynthesisTrace.Notes`, and synthesis failure.
- Where ledger rows are loaded (executor + replay) and confirmation `ArchLucid.ArtifactSynthesis` does **not** reference `Persistence`.
- Default `appsettings.json` posture (must be warn-only).
- Test pass/fail counts.
- Commit hash.
- Confirm system templates (Prompt 8), API/UI (Prompts 9–10), and pre-commit finding engine behavior were **not** changed except shared options enum reuse if applicable.
```

---

---

## Prompt 7 — Report

- **v1 lint rules (`RuleId`):** `ProseHyperscalerFamilyMismatch` (chosen hyperscaler family vs prose token family), `CloudNeutralProseProviderLeak` (cloud-neutral ledger but hyperscaler token without Assumed/Alternative corroboration), `UnledgeredHyperscalerToken` (hyperscaler token not substring of any ledger `TechnologyName` unless ±80 chars contain alternative-label phrases).
- **Warn-only vs enforcing:** `WarnOnly` appends `TechnologyLedgerArtifactLint[{RuleId}]: …` to `SynthesisTrace.Notes` and sets `ArtifactBundleStatus.Partial`; `Enforcing` throws `InvalidOperationException` after structural validation (existing `ArtifactSynthesisFailed` audit path).
- **Ledger load sites:** `AuthorityPipelineStagesExecutor` (`authority.artifacts` stage) and `AuthorityReplayService` (`RebuildArtifacts`) call `ITechnologyLedgerRepository.GetByRunIdAsync` and pass rows into `IArtifactSynthesisService.SynthesizeAsync(manifest, ledgerEntries, ct)`. `ArchLucid.ArtifactSynthesis` references `ArchLucid.Contracts` only — no `Persistence` dependency (`ArtifactSynthesis_must_not_depend_on_Persistence` passes).
- **Options / defaults:** `ArchLucid:TechnologyConsistency:ArtifactLint` — `Enabled: true`, `Mode: WarnOnly` in `ArchLucid.Api/appsettings.json`; reuses `TechnologyConsistencyFindingEngineMode`.
- **Test results:** `TechnologyLedgerArtifactLintOptions` — **2/2 passed**; `TechnologyLedgerArtifactLinter` + `ArtifactSynthesisService` scoped tests — **7/7 passed**.
- **Commit:** `e7eca24395`.
- **Scope confirmation:** system templates (Prompt 8), API/UI (Prompts 9–10), and `TechnologyConsistencyFindingEngine` / `PreCommitGovernanceGate` **not** touched (shared enum reuse only).

---

## Prompt 8 — System prompt template updates (closed-world, neutral-mode, alternative-labeling)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §A root causes #3 (Azure-first prompt default) and #4 (agents lack a shared canonical technology record at generation time), §D fix 6 (prompt template updates), §F (closed-world generation constraint, lock semantics, evidence posture), §G (the three required template clauses — closed-world, neutral-mode, alternative-labeling), and §I acceptance criteria #1 and #4. Also read "Prompt 1 — Report" through "Prompt 7 — Report" in this same file for the ledger shape, agent read-path wiring, pre-commit finding engine, and export prose lint already shipped — **build on that posture**, do not fork parallel prompt-injection helpers or duplicate validation engines in templates.

Work directly on the current branch (master) — no feature branch. Confirm `git status` is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompts 1–7 established the Technology Ledger, wired it into intake and all four agent **user** prompts, added deterministic pre-commit and export-time validation, and shipped warn-only enforcement toggles. This prompt closes fix **D.6** — **generation-source prevention**:

1. Add the assessment §G **closed-world**, **neutral-mode**, and **alternative-labeling** clauses to all four built-in **system** prompt templates (Topology, Cost, Compliance, Critic).
2. Remove or neutralize remaining **Azure-first / Azure-only static guidance** embedded in those templates (especially Compliance control examples and Critic finding-format rules that assume Azure naming).
3. Add a **cloud-neutral system-prompt addendum** in `CloudProviderAgentPromptComposer` when `CloudProvider.None` is the effective target, complementing the AWS/GCP addenda already present — so neutral runs get an explicit system-level counterweight, not only user-prompt branches.

This is **system-template + composer-addendum text only** for v1. Do **not** change agent handler orchestration, ledger seeding, merge policies, `TechnologyConsistencyFindingEngine`, `PreCommitGovernanceGate`, artifact synthesis lint (Prompt 7), API routes (Prompt 9), or the Technology Baseline UI (Prompt 10). Do **not** add new agent-proposed ledger persistence. Do **not** re-touch `RunStarterTaskFactory` objectives or `TechnologyLedgerUserPromptInjection` except shared prompt text constants you deliberately centralize in this prompt.

## Execution-order context (read before coding)

- Built-in templates live under `ArchLucid.AgentRuntime/Prompts/`:
  - `TopologySystemPromptTemplate.cs` (`TemplateId = "topology-system"`, currently `Version = "1.2.0"`)
  - `CostSystemPromptTemplate.cs` (`cost-system`, `1.1.0`)
  - `ComplianceSystemPromptTemplate.cs` (`compliance-system`, `1.1.0`)
  - `CriticSystemPromptTemplate.cs` (`critic-system`, `1.5.0`)
- `CachedAgentSystemPromptCatalog` hashes template text at startup; **bump each edited template's `Version` const** (semver patch minimum) whenever `GetText()` changes — this invalidates stale prompt-repro traces and forces baseline review.
- Handlers call `CloudProviderAgentPromptComposer.ApplySystemPromptAddendum(baseTemplate, agentType, effectiveCloudTarget)` **after** resolving `effectiveCloudTarget` via `TechnologyLedgerEffectiveCloudTarget.Resolve(request, ledgerEntries)` (Prompts 4–5). Templates must state that the **user prompt** carries the authoritative Technology Ledger context and effective cloud target; system prompts must not assume Azure when the user prompt says otherwise.
- `AgentPromptRegressionTests` + `AgentPromptTemplateHashesBaseline.json` guard template drift — expect to update all four baseline SHA-256 entries after intentional text changes.
- Prompt 5 explicitly deferred Compliance's Azure-centric "Key Vault" static guidance list to **this** prompt — neutralize it here.

## 1. Shared clause block (DRY, one class per file)

Create `ArchLucid.AgentRuntime/Prompts/TechnologyConsistencySystemPromptClauses.cs` — `public static` helpers returning verbatim clause text (raw string literals). Suggested surface:

```csharp
public static string ClosedWorldClause { get; }
public static string AlternativeLabelingClause { get; }
public static string NeutralModeClause { get; }          // cloud-neutral effective target
public static string TargetCloudAwarenessClause { get; } // defers to user prompt / ledger
```

### Clause content requirements (assessment §G — implement all)

1. **Closed-world (`ClosedWorldClause`):** instruct the model to reference only technologies already present in the **Technology Ledger context supplied in the user prompt**, or to introduce a new technology only as an explicit **agent-proposed / Assumed** change via the normal `ProposedChanges` shape — never silently substitute a different hyperscaler's equivalent service. Align wording with §F closed-world constraint and Prompt 7's `UnledgeredHyperscalerToken` alternative-label exception phrases (`alternative`, `assumed`, `proposed`, `under consideration`).

2. **Alternative-labeling (`AlternativeLabelingClause`):** any technology mentioned that is **not** the active ledger choice for its role must be explicitly labeled as an **alternative under consideration** (in claims, warnings, or finding messages) — never presented as already chosen.

3. **Neutral-mode (`NeutralModeClause`):** when the user prompt indicates **cloud-neutral** posture (`CloudProvider.None` / no chosen hyperscaler cloud-platform row), do **not** default to Azure (or any hyperscaler) service names, control idioms, or topology patterns unless the ledger or request explicitly requires them. Prefer provider-agnostic role names (API tier, relational datastore, secrets store, identity provider) and generic architectural relationships.

4. **Target-cloud awareness (`TargetCloudAwarenessClause`):** the effective target cloud (Azure, AWS, GCP, or neutral) is determined by the user prompt's ledger context — system instructions must follow that target; do not contradict AWS/GCP user-prompt addenda from `CloudProviderAgentPromptComposer`.

Append all four clauses (or a single composed block that includes them) to **each** of the four templates' `GetText()` bodies in a clearly labeled section, e.g. `Technology Ledger consistency (mandatory):`, placed after the agent role intro and before JSON-shape rules. Keep clauses **identical across agents** where possible; agent-specific nuance belongs in one optional helper parameter only if truly necessary (default: shared text).

Add focused unit tests under `ArchLucid.AgentRuntime.Tests/` (e.g. `TechnologyConsistencySystemPromptClausesTests`) asserting the clause strings are non-empty and contain the key phrases (closed-world, alternative, cloud-neutral, Technology Ledger).

## 2. Update the four system prompt templates

Read each template file in full before editing. For every file you touch:

1. **Bump `Version`** (patch increment).
2. **Append** the shared Technology Ledger consistency block from §1.
3. **Neutralize Azure-only static examples** where they teach the wrong default:

### Topology (`TopologySystemPromptTemplate`)

- Keep per-cloud `RuntimePlatform` enum lists — they are reference material, not an Azure default.
- Ensure opening role text does **not** imply Azure when the user prompt names another cloud or neutral posture (the current "target cloud named in the user prompt" line is good — strengthen with `TargetCloudAwarenessClause` rather than replacing).
- Do not remove JSON structural rules or enum value lists.

### Cost (`CostSystemPromptTemplate`)

- Add clauses; ensure cost guidance does not instruct Azure Retail citation when the user prompt indicates AWS/GCP/neutral (cross-check with existing `CloudProviderAgentPromptComposer` Cost addenda).
- No topology mutation rules change.

### Compliance (`ComplianceSystemPromptTemplate`)

- **Replace** the Azure-skewed "Important guidance" control name list (`Key Vault`, etc.) with a **provider-neutral core set** plus explicit note that concrete control product names must match the effective target cloud from the user prompt (Azure Key Vault vs AWS Secrets Manager vs GCP Secret Manager only when that cloud is active).
- Keep `RequiredControls` / findings JSON shape unchanged.
- Rule 10 currently says "unless tied to a named resource" with Key Vault as the inline example — generalize the example to "secrets store" or "named resource".

### Critic (`CriticSystemPromptTemplate`)

- **Generalize rule 17** ("named Azure element from the uploaded package") to **named architecture element** from the uploaded package for the **effective target cloud** (or cloud-neutral element IDs when neutral). Do not weaken Novelty Check, adversarial stance, 8-finding cap, or confidenceLevel rules.
- Rule 14's Key Vault parenthetical — generalize like Compliance.
- Add the shared ledger clauses without diluting "You MUST challenge the other agents' implied decisions".

## 3. Cloud-neutral system addendum (`CloudProviderAgentPromptComposer`)

Read `CloudProviderAgentPromptComposer.TryGetSystemPromptAddendum` — today it returns `null` for `CloudProvider.Azure` **and** `CloudProvider.None`.

Add a **neutral-mode system addendum** when `cloudProvider == CloudProvider.None` for all four agent types (`Topology`, `Cost`, `Compliance`, `Critic`). Suggested content (tune wording, keep concise):

- Effective target is **cloud-neutral** — do not inject Azure-, AWS-, or GCP-specific product names unless they appear in the Technology Ledger context or are explicitly proposed as alternatives.
- Prefer provider-agnostic architectural language; cite hyperscaler products only when ledger-corroborated.

Do **not** remove existing AWS/GCP addenda. Do **not** add a None addendum when `cloudProvider == CloudProvider.Azure` (Azure base templates already allow Azure idioms; user prompt + ledger carry the rest).

Add/extend tests in `ArchLucid.AgentRuntime.Tests` (new file or existing composer tests) asserting:
- `None` → non-null addendum containing cloud-neutral language for each agent type.
- `Aws`/`Gcp` → existing addenda still returned.
- `Azure` → still null addendum (base template only).

## 4. Tests and baselines

1. **`TechnologyConsistencySystemPromptClausesTests`** — clause presence / key phrases.
2. **`TechnologyConsistencySystemPromptTemplateTests`** (or extend an existing template test class) — each of the four `*SystemPromptTemplate.GetText()` results contain `ClosedWorldClause` key phrases (or the composed block), alternative-labeling language, and neutral-mode language; Compliance/Critic do **not** contain unconditional "named Azure element" or Azure-only control guidance as the **only** example.
3. **`CriticAgentHandlerTests.SystemPromptTemplate_RequiresAdversarialChallengeOfOtherAgents`** — update assertions if template text shifts; must still require adversarial challenge, Novelty Check, 8-finding cap, etc.
4. **`AgentPromptRegressionTests`** — update `AgentPromptTemplateHashesBaseline.json` for all four agents after version bumps. Run the hash tests locally; update baseline values only after human-readable review of the new prompt text (the test failure message prints the new SHA-256).

Do **not** run the full solution test suite.

## 5. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj
```

Then scoped tests only, e.g.:

```
dotnet test ArchLucid.AgentRuntime.Tests --filter "FullyQualifiedName~TechnologyConsistencySystemPrompt|FullyQualifiedName~CloudProviderAgentPromptComposer|FullyQualifiedName~SystemPromptTemplate|FullyQualifiedName~AgentPromptRegression"
```

Adjust filters to match the test classes you add or touch.

## 6. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Add Technology Ledger consistency clauses to agent system prompt templates"). Push only if explicitly requested.

## 7. Report

Stop and report:

- The exact clause helpers added and where they are appended in each template.
- Template version bumps (`topology-system@…`, etc.).
- Compliance/Critic Azure-only examples neutralized (before/after summary).
- `CloudProviderAgentPromptComposer` neutral (`None`) addendum behavior per agent type.
- `AgentPromptTemplateHashesBaseline.json` updates (list which keys changed).
- Test pass/fail counts.
- Commit hash.
- Confirm ledger seeding, handler user-prompt wiring (beyond shared constants), finding engine (Prompt 6), artifact lint (Prompt 7), API/UI (Prompts 9–10) were **not** touched.
```

---

## Prompt 8 — Report

- **Clause helpers:** `TechnologyConsistencySystemPromptClauses` — `ClosedWorldClause`, `AlternativeLabelingClause`, `NeutralModeClause`, `TargetCloudAwarenessClause`, composed as `MandatoryBlock` and appended after each agent role intro in all four `*SystemPromptTemplate.GetText()` implementations.
- **Template version bumps:** `topology-system@1.3.0`, `cost-system@1.2.0`, `compliance-system@1.2.0`, `critic-system@1.6.0`.
- **Azure-only neutralization:** Compliance — provider-neutral control themes (secrets store examples per cloud); Critic — rule 17 uses "named architecture element" (not Azure-only); rule 14 / Compliance rule 10 use "secrets store" instead of Key Vault-only examples; Cost rule 7 cites cloud-specific retail grounding for the effective target.
- **Cloud-neutral addendum:** `CloudProviderAgentPromptComposer` returns a shared `cloud-neutral` system addendum for `CloudProvider.None` on Topology, Cost, Compliance, and Critic; Azure still receives no addendum; AWS/GCP addenda unchanged.
- **Baseline hash updates:** `topology`, `compliance`, `critic`, `cost` keys in `AgentPromptTemplateHashesBaseline.json`.
- **Test results:** scoped AgentRuntime tests — **28/28 passed**.
- **Commit:** `bc56e5f5aa`.
- **Scope confirmation:** ledger seeding, handler user-prompt wiring, `TechnologyConsistencyFindingEngine`, artifact lint (Prompt 7), API/UI (Prompts 9–10) **not** touched.

---

## Prompt 9 — Technology Ledger run API (`GET` / `PATCH` for baseline review)

```
Read docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md in full for context before starting, specifically §D fix 7 (Technology Baseline UI / human approval of ledger facts), §E step 5 (operator reviews and locks baseline choices before downstream generation commits), and §F (ledger statuses: `Chosen` is authoritative, `Assumed` is agent-proposed pending approval). Also read "Prompt 1 — Report" through "Prompt 8 — Report" in this same file — the ledger model, seeding, agent merge policy, finding engine, artifact lint, and system prompt clauses are already shipped. **Build on `ITechnologyLedgerRepository` and existing contract types**; do not fork a second ledger store.

Work directly on the current branch (master) — no feature branch. Confirm git status is clean of unrelated changes before starting; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

## Goal

Prompts 1–8 populated and consumed the Technology Ledger inside the generation pipeline, but there is **no HTTP surface** for operators to read or curate ledger rows before the Technology Baseline UI (Prompt 10). This prompt adds the **run-scoped API** required by fix **D.7**:

1. **`GET`** — return all ledger entries for a run (ordered like the repository: `CreatedUtc` ascending).
2. **`PATCH`** — allow an operator to update a single entry's approval fields (`Status`, `IsLocked`, `Rationale`, and optionally `TechnologyName` / `ProviderFamily` when promoting an `Assumed` row) with validation that preserves ledger invariants.

This is **API + application command service only** for v1. Do **not** build `archlucid-ui` (Prompt 10). Do **not** change agent handlers, seeders, merge policies, `TechnologyConsistencyFindingEngine`, `PreCommitGovernanceGate`, or `ArtifactSynthesisService` lint. Do **not** add new SQL tables or migrations — reuse `ITechnologyLedgerRepository.GetByRunIdAsync` and `UpdateAsync` only.

## Execution-order context (read before coding)

- Mirror existing run-scoped authority controllers: `RunQueryController` (scope + run existence), `RunsController.PinRun` (scoped `PATCH` with audit), `ArtifactExportController` (read policy + rate limiting).
- Route shape should align with other run APIs the UI already calls — prefer the canonical run prefix used by `RunQueryController`:

  - `GET /v{version:apiVersion}/runs/{runId:guid}/technology-ledger`
  - `PATCH /v{version:apiVersion}/runs/{runId:guid}/technology-ledger/{entryId}`

- `GET` requires `ArchLucidPolicies.ReadAuthority`; `PATCH` requires `ArchLucidPolicies.ExecuteAuthority` (baseline curation is an operator action, not passive read).
- Resolve `ScopeContext` via `IScopeContextProvider.GetCurrentScope()` and verify the run exists in scope before reading/updating ledger rows (404 when run missing; 404 when entry id not found for that run).
- The repository already scopes reads by tenant/workspace/project — do not bypass it.

## 1. API models (`ArchLucid.Api/Models/TechnologyLedger/`)

Create one type per file. Use XML doc comments and nullable reference types consistent with sibling `ArchLucid.Api/Models/*` types.

1. `TechnologyLedgerEntryResponse.cs` — outward DTO mirroring `TechnologyLedgerEntry` fields the UI needs:
   - `EntryId`, `RunId`, `Role`, `TechnologyName`, `ProviderFamily`, `Status`, `Source`, `EvidenceRef`, `Rationale`, `IsLocked`, `CreatedUtc`, `UpdatedUtc`
   - Use string enums in JSON (match existing API enum serialization — check a nearby model using `CloudProvider` or contract enums).

2. `TechnologyLedgerListResponse.cs` — wrapper:
   - `string RunId`
   - `IReadOnlyList<TechnologyLedgerEntryResponse> Entries`

3. `PatchTechnologyLedgerEntryRequest.cs` — partial update body (all properties optional except at least one must be present):
   - `TechnologyLedgerStatus? Status`
   - `bool? IsLocked`
   - `string? Rationale`
   - `string? TechnologyName` (optional correction when promoting an `Assumed` agent proposal)
   - `CloudProvider? ProviderFamily` (optional correction paired with `TechnologyName`)

4. `PatchTechnologyLedgerEntryResponse.cs` — returns the updated `TechnologyLedgerEntryResponse`.

Add a static mapper `TechnologyLedgerEntryMapper` (own file under `ArchLucid.Api/Mapping/` or colocated with models if that matches nearby patterns) — `ToResponse(TechnologyLedgerEntry entry)`.

## 2. Application command service (`ArchLucid.Application`)

Create interface + implementation (one class per file) under `ArchLucid.Application/Runs/TechnologyLedger/`:

```csharp
public interface ITechnologyLedgerRunCommandService
{
    Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<TechnologyLedgerEntry> PatchEntryAsync(
        ScopeContext scope,
        Guid runId,
        string entryId,
        PatchTechnologyLedgerEntryCommand command,
        CancellationToken cancellationToken = default);
}
```

`PatchTechnologyLedgerEntryCommand` is an Application-layer command record (not the API request type) with the same optional fields as the HTTP body.

### Validation rules (v1 — enforce in the service, not the controller)

Load existing rows via `GetByRunIdAsync` before applying a patch:

1. **Run + entry existence** — entry must belong to `runId`; otherwise throw a not-found exception the controller maps to 404.

2. **Immutable identity fields** — do **not** allow changing `EntryId`, `RunId`, `Role`, `Source`, `EvidenceRef`, or `CreatedUtc` via PATCH.

3. **Locked row guard** — when the stored row has `IsLocked == true`, reject patches that change `Status`, `TechnologyName`, or `ProviderFamily` (return a validation/business-rule failure the controller maps to 400). Allow `IsLocked: false` (unlock) and `Rationale` updates even when locked.

4. **At most one `Chosen` per role** — when `Status` is being set to `Chosen`, demote any **other** `Chosen` row for the same `Role` on this run to `Alternative` (or `Assumed` if you prefer — pick one and document in the report; `Alternative` is suggested so the prior choice remains visible). Apply demotions in the same logical operation before persisting the target row (multiple `UpdateAsync` calls are fine for v1).

5. **Promote `Assumed` → `Chosen`** — when the stored row's `Status` is `Assumed` and the patch sets `Status` to `Chosen`, set `Source = TechnologyLedgerSource.User` on the updated row (human approval supersedes agent-proposed origin). Do **not** rewrite `Source` for `Evidence` or already-`Chosen` rows unless you have an explicit test requirement — default: leave `Source` unchanged except for the Assumed→Chosen promotion case.

6. **Field normalization** — trim `TechnologyName` / `Rationale`; reject empty `TechnologyName` when provided.

7. **Timestamp** — set `UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime` on every successful patch.

Inject dependencies:
- `ITechnologyLedgerRepository`
- `IRunRepository` (or the same run-existence guard `RunQueryController` uses — verify run exists in scope before ledger access)

Register in DI next to other run services (`ServiceCollectionExtensions.ApplicationPipeline.cs` or the authority/run extension): `services.AddScoped<ITechnologyLedgerRunCommandService, TechnologyLedgerRunCommandService>()`.

## 3. Controller (`ArchLucid.Api/Controllers/Authority/TechnologyLedgerController.cs`)

Primary-constructor controller:

- `[ApiController]`, `[ApiVersion("1.0")]`, `[EnableRateLimiting("fixed")]`
- Class-level `[Authorize(Policy = ReadAuthority)]` with method-level `[Authorize(Policy = ExecuteAuthority)]` on PATCH only.
- Route base: `[Route("v{version:apiVersion}/runs")]`

Endpoints:

1. **`GET {runId:guid}/technology-ledger`**
   - Returns `TechnologyLedgerListResponse`.
   - 404 when run not found.

2. **`PATCH {runId:guid}/technology-ledger/{entryId}`**
   - Body: `PatchTechnologyLedgerEntryRequest`.
   - 400 when body null/empty, validation fails, or locked-row guard trips.
   - 404 when run or entry not found.
   - On success, emit an audit event (mirror `RunsController.PinRun` style) e.g. `AuditEventTypes.TechnologyLedgerEntryUpdated` — add the constant if missing, with `DataJson` containing `entryId`, `role`, `status`, `isLocked` (no secrets).

Use existing `ProblemDetails` helpers (`NotFoundProblem`, `BadRequestProblem`, etc.) and `ProblemTypes` entries consistent with sibling controllers.

## 4. Tests

Add focused tests — do **not** run the full solution test suite.

### Application (`ArchLucid.Application.Tests/Runs/TechnologyLedger/`)

`TechnologyLedgerRunCommandServiceTests` using in-memory `ITechnologyLedgerRepository` + test run repo/double:

1. `GetByRunIdAsync` returns rows ordered by `CreatedUtc`.
2. Patch `Assumed` → `Chosen` sets `Source = User`.
3. Promoting a second row to `Chosen` for the same role demotes the prior `Chosen`.
4. Locked row rejects `Status` / `TechnologyName` changes.
5. Unlock + rationale update succeeds on locked row.
6. Missing entry → not-found exception.

### API (`ArchLucid.Api.Tests/`)

`TechnologyLedgerControllerTests` (unit tests with mocked `ITechnologyLedgerRunCommandService`, `IScopeContextProvider`, `IAuditService` — follow `DraftRequestsControllerTests` style):

1. GET happy path maps response DTOs.
2. PATCH happy path returns 200 and audits.
3. PATCH null body → 400, no audit.
4. Service throws not-found → 404.

## 5. Verify

Run, one at a time:

```
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Application/ArchLucid.Application.csproj
.\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Api/ArchLucid.Api.csproj
```

Then scoped tests only:

```
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~TechnologyLedgerRunCommand"
dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~TechnologyLedger"
```

## 6. Commit

Stage only files this prompt touches. Do not stage unrelated dirty files. Commit directly to `master` with a descriptive message (e.g. "Add Technology Ledger GET/PATCH run API for baseline review"). Push only if explicitly requested.

## 7. Report

Stop and report:

- Final route URLs and authorization policies (`ReadAuthority` vs `ExecuteAuthority`).
- PATCH validation rules as implemented (especially demotion behavior for duplicate `Chosen` per role and `Assumed`→`Chosen` `Source` rewrite).
- Audit event type and payload shape.
- Test pass/fail counts.
- Commit hash.
- Confirm agent/seed/finding-engine/artifact-lint/system-template/UI (Prompt 10) code was **not** touched.
```

---

## Prompt 9 — Report

- **Routes:** `GET /v1/runs/{runId:guid}/technology-ledger` (`ReadAuthority`); `PATCH /v1/runs/{runId:guid}/technology-ledger/{entryId}` (`ExecuteAuthority`).
- **PATCH validation:** locked rows reject `Status` / `TechnologyName` / `ProviderFamily` changes (unlock + rationale allowed); promoting to `Chosen` demotes other `Chosen` rows for the same role to `Alternative`; `Assumed` → `Chosen` sets `Source = User`; empty patch body rejected.
- **Audit:** `AuditEventTypes.TechnologyLedgerEntryUpdated` with `entryId`, `role`, `status`, `isLocked` in `DataJson`.
- **Test results:** `TechnologyLedgerRunCommandServiceTests` — **6/6 passed**; `TechnologyLedgerControllerTests` — compiled with `ArchLucid.Api` (Api.Tests solution build blocked by unrelated pre-existing `ArchitectureRunExecuteOrchestratorTestFactory` reference in another test file).
- **Commit:** `ec24cb0b42`.
- **Scope confirmation:** agent handlers, seeders, merge policies, `TechnologyConsistencyFindingEngine`, `PreCommitGovernanceGate`, artifact lint, system templates, and UI (Prompt 10) **not** touched.

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
