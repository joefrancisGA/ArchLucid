> **Scope:** Contributor-reference — Architecture constraint tests (NetArchTest) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Architecture constraint tests (NetArchTest)

Automated checks that selected **ArchLucid** assemblies respect layering and dependency boundaries. Implementation: **`ArchLucid.Architecture.Tests`** ([`DependencyConstraintTests.cs`(../../ArchLucid.Architecture.Tests/DependencyConstraintTests.cs)), using **[NetArchTest.Rules](https://github.com/BenMorris/NetArchTest)** (central version in [`Directory.Packages.props`(../../Directory.Packages.props)).

**See also:** [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) (what each module is for), [TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md) (how `Suite=Core` and fast-core filters run in CI and locally), [LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md](LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md) (**TB-1005** — NetArchTest ≠ isolation; ranked runtime residuals).

---

## 1. Objective

Catch **accidental coupling** early: foundation assemblies pulling in hosts, domain modules referencing SQL/persistence facades, persistence sub-modules referencing the wrong sibling assemblies, or the CLI taking a dependency on the API **host** assembly instead of the HTTP **client**.

---

## 2. Assumptions

- **Namespace prefixes** are a stable proxy for “depends on area X” when using NetArchTest `HaveDependencyOn` / `HaveDependencyOnAny` (prefix semantics per library).
- **Persistence split assemblies** intentionally share logical areas under `ArchLucid.Persistence.*` in source; **assembly references** are the reliable signal for submodule boundaries (Tier 2), not namespace strings alone.
- The CLI legitimately uses **`ArchLucid.Api.Client`** (generated OpenAPI client under `ArchLucid.Api.Client.Generated`). That must **not** be confused with a reference to the **`ArchLucid.Api`** host assembly.

---

## 3. Constraints

- Rules are **test-only**: no production project references NetArchTest.
- **One test case per rule** so CI output names the exact violation: manifest rules run as theory rows keyed by the rule sentence, and rules needing bespoke evidence stay `[Fact]`.
- Each test is tagged **`[Trait("Suite", "Core")]`** so it runs with the corset / fast-core pipelines (see [TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md)).
- Forbidden namespace lists for Tier 1 live in [`ArchitectureConstraintNamespaces.cs`(../../ArchLucid.Architecture.Tests/ArchitectureConstraintNamespaces.cs); extend those arrays when new first-party `ArchLucid.*` areas appear.

---

## 4. Architecture overview

| Tier | Scope | Mechanism |
|------|--------|-----------|
| **1** | **Core**, **Contracts**, **Contracts.Abstractions** | NetArchTest `ShouldNot().HaveDependencyOnAny(...)` |
| **2** | **Persistence.Coordination**, **Persistence.Integration** vs Runtime / Advisory / Alerts | `Assembly.GetReferencedAssemblies()` + FluentAssertions |
| **3** | **Decisioning**, **KnowledgeGraph**, **ContextIngestion**, **ArtifactSynthesis** vs **`ArchLucid.Persistence`** | NetArchTest `ShouldNot().HaveDependencyOn("ArchLucid.Persistence")` |
| **4** | **Cli** vs persistence and API host | NetArchTest for `ArchLucid.Persistence`; **assembly metadata** for `ArchLucid.Api` (see below) |
| **4b** | **`Backfill.Cli`** maintenance host (documented exception) | Assembly allowlist + csproj project-reference scan; must not depend on `ArchLucid.Application` |

### Tier 4b — `Backfill.Cli` maintenance host

`ArchLucid.Backfill.Cli` is the **only** CLI that references `ArchLucid.Persistence` directly. It is a one-time JSON → relational migration tool, not an operator HTTP client. It composes `SqlRelationalBackfillService` / `SqlCutoverReadinessService` from `Persistence.Coordination.Backfill` without an Application use-case layer.

| Test case | Rule |
|------|------|
| `BackfillCli_first_party_assembly_references_must_match_allowlist` (fact) | May reference only `Core`, `Contracts`, `KnowledgeGraph`, `Persistence` |
| `BackfillCli_csproj_must_only_declare_allowed_project_references` (fact) | Direct `ProjectReference` entries: `KnowledgeGraph`, `Persistence` only |
| *Backfill.Cli must not depend on Application* (namespace manifest) | No Application orchestration in the maintenance host |
| *Backfill.Cli references the Persistence assembly by design* (assembly manifest) | The documented exception is pinned, not merely tolerated |

Allowlists live in [`ArchitectureConstraintMaintenanceHosts.cs`](../../ArchLucid.Architecture.Tests/ArchitectureConstraintMaintenanceHosts.cs). Operator docs: [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md).

Compare with Tier 4 **`ArchLucid.Cli`**: thin HTTP client (`Api.Client` only). **`ArchLucid.Jobs.Cli`** uses `Host.Composition` and is excluded from Tier 4 persistence rules via the composition-root exclusion list in `SingleCompositionRootServiceCollectionExtensionsTests`.

### Why Tier 4 uses assembly metadata for `ArchLucid.Api`

`HaveDependencyOn("ArchLucid.Api")` matches any namespace that **starts with** that prefix, including **`ArchLucid.Api.Client`**. The intended rule is: **no project reference to the `ArchLucid.Api` assembly** (the ASP.NET host). The assembly-manifest rule ***Cli must not reference the Api host assembly*** asserts `GetReferencedAssemblies()` does not contain `ArchLucid.Api`, while still allowing **`ArchLucid.Api.Client`**.

---

## 5. Component breakdown

| Piece | Role |
|--------|------|
| **`ArchLucid.Architecture.Tests`** | Holds rules; references only the assemblies under test (no product code changes). |
| **`ArchitectureConstraintNamespaces`** | Single place to maintain Tier 1 forbidden prefix lists. |
| **Constraint manifests** | The rules themselves, as data keyed by the rule sentence shown in CI: `ArchitectureNamespaceConstraintManifest` (NetArchTest), `ArchitectureAssemblyReferenceConstraintManifest` (compiled metadata), `ArchitectureProjectReferenceConstraintManifest` (`*.csproj` edges), `ArchitectureTypeAbsenceConstraintManifest` (type placement). |
| **`ArchitectureConstraintAssemblies`** | Maps an assembly name to its anchor type (`typeof(...).Assembly`), so renaming types inside an assembly does not break resolution unnecessarily, and manifest rows stay declarative. |
| **`DependencyConstraintTests`** | One theory row per manifest rule (plus facts for rules needing bespoke evidence: source scans, reference allowlists, UI OpenAPI trace). |
| **`TestClassTraitCategorizationArchitectureTests`** | Roslyn source scan: every public `*Tests` class in a `*.Tests` project folder must declare `[Trait("Suite", …)]` and/or `[Trait("Category", …)]` at class scope (see `docs/library/TEST_EXECUTION_MODEL.md`). |

---

## 6. Data flow

At test run time, NetArchTest loads the target assembly and walks type references to evaluate dependency rules. Tier 2 and the CLI API-host check use **assembly reference metadata** only (no IL graph).

---

## 7. Security model

These tests do not enforce runtime security controls. They reduce risk indirectly by **preventing layering escapes** that could drag sensitive infrastructure (SQL, host internals) into unintended tiers.

---

## 8. Operational considerations

**Run locally (repo root):**

```bash
dotnet test ArchLucid.sln --filter "Suite=Core"
```

Fast core (excludes slow/integration-tagged tests elsewhere; architecture tests use `Category=Unit`):

```bash
dotnet test ArchLucid.sln --filter "Suite=Core&Category!=Slow&Category!=Integration"
```

**NetArchTest quirk (string field constants):** For `ShouldNot().HaveDependencyOnAny(...)`, the library scans **compile-time string constants on fields** and treats **`:`** like **`.`** as a namespace separator (see `NamespaceTree` in NetArchTest). A `public const string` such as `"ArchLucid:Persistence"` is therefore parsed as **`ArchLucid.Persistence`** and can fail ***Core must not depend on other first-party areas*** even though Core has no real reference to the persistence assembly. Prefer a **`static` property** that builds the path with `string.Concat` (or keep the literal only in a host layer), as in **`ArchLucidPersistenceOptions.SectionPath`**.

**Adding a rule:** Add a row to the matching constraint manifest (§5); the class-level `Suite=Core` / `Category=Unit` traits already cover it. Reuse `ArchitectureConstraintNamespaces` for Tier 1–style prefix sets. For “must not reference assembly X”, use the **assembly-reference** manifest (`GetReferencedAssemblies()`) when namespace-prefix checks would false-positive, and the **project-reference** manifest to catch the build-graph edge before any code consumes it.

**CI:** The same `Suite=Core` filter used by the “fast core” job picks up this project once it is in **`ArchLucid.sln`**.

---

## 9. Evolution

If the solution gains new **leaf** or **foundation** assemblies, update **`ForbiddenFromCore`** / **`ForbiddenFromContracts`** / **`ForbiddenFromContractsAbstractions`** so Tier 1 stays complete. If persistence splits further, add Tier 2-style assembly reference facts mirroring the intended DAG.

**DDL smoke (tenant scope on `dbo.Runs`):** **`TenantScopedTableDdlTests`** in **`ArchLucid.Architecture.Tests`** reads **`ArchLucid.Persistence/Scripts/ArchLucid.sql`** and asserts the **`dbo.Runs`** `CREATE TABLE` block includes **`TenantId`**, **`WorkspaceId`**, and **`ProjectId`** — a cheap guard when extending the master DDL (scope columns are the app-layer isolation anchor per ADR 0037).

**Batch 5 boundary guards (2026-05-28):**

| Test case | Rule |
|------|------|
| *Retrieval must not reference the Api assembly* (assembly manifest) | Retrieval stays below the HTTP host |
| *AgentRuntime must not reference host or infrastructure root assemblies* (assembly manifest) | AgentRuntime must not reference `ArchLucid.Api`, `ArchLucid.Host.*`, or `ArchLucid.Worker` |
| `Ui_openapi_types_must_trace_to_canonical_snapshot` (fact) | `archlucid-ui/src/lib/openapi-schemas.ts` re-exports generated types from `api-types.generated.ts`, sourced from `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` |

---

## 10. Compatibility stub governance (Batch G / Improvement #21)

During the Core port migration, **`ArchLucid.Decisioning`** still exposes **compatibility stubs** — thin interface aliases that inherit canonical ports from **`ArchLucid.Core`**. These exist so legacy `using ArchLucid.Decisioning.*` call sites keep compiling while ports move to Core.

| Rule | Enforcement |
|------|-------------|
| No new stubs without an allowlist entry | [`ArchitectureConstraintCompatibilityStubCatalog.cs`](../../ArchLucid.Architecture.Tests/ArchitectureConstraintCompatibilityStubCatalog.cs) |
| Stubs must inherit exactly one canonical Core port | [`DecisioningCompatibilityStubArchitectureTests.cs`](../../ArchLucid.Architecture.Tests/DecisioningCompatibilityStubArchitectureTests.cs) |
| Pure alias stubs must not declare Decisioning-specific members | Same test suite (`must_not_add_undocumented_members`) |
| Legacy type-bridge stubs (Decisioning context/model adapters) must be allowlisted with `AllowsLegacyTypeBridge` | [`ArchitectureConstraintCompatibilityStubCatalog.cs`](../../ArchLucid.Architecture.Tests/ArchitectureConstraintCompatibilityStubCatalog.cs) — currently `IAlertEvaluator`, `IAlertMetricSnapshotBuilder`, `IComplianceRulePackLoader`, `IComplianceRulePackProvider` |
| Source must contain a `Compatibility stub` marker | Same test suite |

**Removal criteria (default):** delete a stub when no production or test code imports the Decisioning namespace alias; callers must reference the canonical Core port directly. Each allowlist entry may override this in the catalog.

**Do not add new compatibility stubs** unless a breaking migration window is explicitly approved. Prefer placing new ports in Core (see §11).

---

## 11. Where new ports and interfaces belong

Use this table when introducing a new seam. **`DependencyConstraintTests`** and related Architecture.Tests guard the boundaries.

| Kind | Place it in | Examples |
|------|-------------|----------|
| Shared HTTP/API DTOs and enums | **`ArchLucid.Contracts`** | Request/response models, metadata records |
| Cross-cutting domain ports (persistence, alerts, governance, advisory) | **`ArchLucid.Core`** under the appropriate namespace (`Core.Persistence.Ports`, `Core.Alerts`, `Core.Governance`, …) | `IDecisionEngine`, `IAlertService`, `IPolicyPackResolver` |
| Use-case orchestration and application services | **`ArchLucid.Application`** | `ManifestFinalizationService`, ROI aggregators |
| SQL/Dapper adapters and repository implementations | **`ArchLucid.Persistence`** (and **`Persistence.Data.*`** for HTTP workflow repos) | `SqlRunRepository`, `SqlGoldenManifestRepository` |
| Domain analysis / merge / findings logic | **`ArchLucid.Decisioning`** | `RuleBasedDecisionEngine`, manifest merge — **not** new port stubs |
| Agent execution and explanation adapters | **`ArchLucid.AgentRuntime`** | `RealAgentExecutor`, explanation port implementations |
| Retrieval indexing and query orchestration | **`ArchLucid.Retrieval`** | `RetrievalQueryService` |
| Infrastructure adapters (webhooks, extractors, DevOps) | **`ArchLucid.Integrations.*`** / **`ArchLucid.Notifications`** | Azure extractor client, webhook poster |
| DI wiring and storage provider registration | **`ArchLucid.Host.Composition`** only | `ServiceCollectionExtensions.*`, `SqlStorageProviderRegistrar` |
| HTTP host pipeline | **`ArchLucid.Api`** | Controllers, middleware — no direct Decisioning/Persistence orchestration |

**Layer ordering (TB-031):** **`ArtifactSynthesis`** may depend on **`Decisioning`**; **`Decisioning`** must **not** depend on **`ArtifactSynthesis`**. Documented in [`SYSTEM_MAP.md`](SYSTEM_MAP.md) and enforced by the namespace-manifest rule *Decisioning must not depend on ArtifactSynthesis*.
