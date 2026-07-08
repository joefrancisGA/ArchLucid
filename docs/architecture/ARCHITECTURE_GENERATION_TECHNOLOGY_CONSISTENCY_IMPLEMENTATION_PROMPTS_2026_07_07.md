> **Scope:** Copy-paste Composer/agent prompts implementing fix D.1–D.10 from the assessment below, run **one at a time directly against `master`**. Each prompt is self-contained (restates relevant context) so it can be run in a fresh Composer session with no prior chat history. Review the diff and test results after each prompt before starting the next.
>
> **Assessment date:** 2026-07-07
> **Source assessment:** [`ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md`](ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md) — read this first; it contains the full diagnosis, severity rating, root causes, and the fix D.1–D.10 priority order that these prompts implement. **Note (2026-07-07, evening):** the original assessment file disappeared from the working tree before it was committed (it was untracked). It has been **regenerated** (same date) from the conversation record rather than recovered byte-for-byte — see the regeneration note at the top of that file for what is reconstructed vs. verbatim.
>
> **Workflow (owner decision, 2026-07-07):** Prompts run **directly on `master`**, no feature branches, local commits only after each prompt's tests pass — do not push to `origin/master` unless explicitly requested. This mirrors the workflow already used for [`OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md`](OVERVIEW_PAGE_FIRST_USE_IA_IMPLEMENTATION_PROMPTS_2026_07_05.md). **Exception:** for Prompt 1, the owner explicitly asked to push to `origin/master` as part of running it (2026-07-07); the default for Prompt 2 onward remains local-commit-only unless push is explicitly requested again.

# Architecture generation technology consistency — implementation prompts

**Status:** Prompt 1 **complete** — committed `daaa784505` and pushed to `origin/master` (2026-07-07, explicit push request). See "Prompt 1 — Report" below for the actual shape produced. Prompts 2+ are intentionally **not written yet** — this is backend/agent-behavior work with more branching risk than a UI cleanup, so later prompts are drafted only after the prior step's actual shape (table name, repository interface, enum values) is known. See "Planned sequence" below for the intended order.

Work directly on `master` for every prompt below. Confirm `git status` is clean of unrelated changes before starting each prompt; if pre-existing unrelated unstaged changes are present in the working tree, leave them untouched and do not stage or commit them alongside this task's changes.

---

## Planned sequence (subject to revision after each step)

| # | Fix (from assessment §D) | Scope | Status |
| --- | --- | --- | --- |
| **1** | D.1 | Technology Ledger data model — contracts, SQL table, repository (additive only; nothing reads or writes it yet) | **Done** (`daaa784505`) |
| 2 | D.2 | Wire ledger into intake: required target-cloud/neutral question, fix `DraftRequestProjector`, seed `source: user` ledger entries from `ArchitectureRequest` | Not started |
| 3 | D.1 (cont.) | Seed `source: evidence` ledger entries from context connectors (IaC declarations, cloud inventory ZIP) | Not started |
| 4 | D.3 | Inject ledger into `TopologyAgentHandler` / `RunStarterTaskFactory` objectives; agent proposals become `source: agent-proposed` ledger entries instead of untracked `ProposedChanges` free text | Not started |
| 5 | D.3 | Share ledger downstream to Cost/Compliance/Critic prompts (extend `StagedPriorAgentsSummary`) | Not started |
| 6 | D.4 | `TechnologyConsistencyFindingEngine` — deterministic provider/database/identity/messaging/runtime mismatch detection, wired into `PreCommitGovernanceGate` **behind a warn-only/enforcing options toggle** (mirroring the existing `AgentOutputQualityGateOptions` enable/severity pattern) so it ships surfacing findings without blocking commits on existing sample/demo runs until explicitly flipped to enforcing | Not started |
| 7 | D.5 | Structured-first artifact synthesis — prose lint against ledger in `ArtifactSynthesisService` | Not started |
| 8 | D.6 | Prompt template updates — closed-world clause, neutral-mode clause, alternative-labeling clause across all four system prompt templates | Not started |
| 9 | D.7 | **API endpoint** — `GET`/`PATCH` ledger routes on the run so the UI has something to call (missing piece between the repository and the UI panel; not called out as its own fix in the assessment but required before step 10 can work) | Not started |
| 10 | D.7 | Technology Baseline UI panel + approval step (`archlucid-ui`), consuming the endpoint from step 9 | Not started |
| 11 | D.9 | Golden-corpus consistency scenarios in CI | Not started |

Only **Prompt 1** is written out below. Run it, review the result, then ask for Prompt 2 to be drafted against the ledger shape Prompt 1 actually produced.

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
