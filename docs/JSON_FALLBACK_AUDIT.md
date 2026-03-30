# 53R — JSON fallback audit and centralized policy

## Objective

Audit every remaining JSON-column fallback path in persistence and route the allow/deny decision through **one** policy seam (`JsonFallbackPolicy`) so that:

- Fallback usage is **explicit**, not ad-hoc.
- Future removal of fallback requires changing **one enum value**, not hunting through six files.
- Current behavior is **preserved by default** (`PersistenceReadMode.AllowJsonFallback`).

---

## Policy seam

### `PersistenceReadMode` enum

| Value | Behavior |
|-------|----------|
| **`AllowJsonFallback`** (default) | Legacy behavior. Empty relational → silently read JSON column. |
| **`WarnOnJsonFallback`** | Same as Allow, but emits a structured `ILogger.LogWarning` each time fallback is used. Message includes slice name, entity type, and entity id. Use during migration roll-out to monitor residual JSON reads. |
| **`RequireRelational`** | If relational child rows are absent for a slice, throw `RelationalDataMissingException`. Use after confirming all environments are fully backfilled. |

### `JsonFallbackPolicy`

Constructed with `(PersistenceReadMode mode, ILogger logger)`. Parameterless constructor defaults to `AllowJsonFallback` with `NullLogger`.

| Method | Purpose |
|--------|---------|
| `EvaluateFallback(int relationalRowCount, string sliceName, string entityType, string entityId)` | Full evaluation: returns `true` to fall back, `false` to use relational, or **throws** `RelationalDataMissingException` in `RequireRelational` mode. |
| `ShouldFallbackToJson(int relationalRowCount, string sliceName)` | Backward-compatible overload (delegates to `EvaluateFallback`). |

| Property | Purpose |
|----------|---------|
| `Mode` | Current `PersistenceReadMode`. |
| `AllowFallback` | Computed: `true` unless `RequireRelational`. |

Registered as a **singleton** in `ArchiForgeStorageServiceCollectionExtensions` (SQL provider path only).

### `RelationalDataMissingException`

Thrown by `RequireRelational` mode. Properties: `EntityType`, `EntityId`, `SliceName`. Message includes a recommendation to run `SqlRelationalBackfillService`.

### `RelationalFirstRead.ReadSliceAsync` (updated)

Policy-aware overload accepts `JsonFallbackPolicy?`, `sliceName`, `emptyDefault`, and optional `entityType`/`entityId` for diagnostics. The old two-argument overload (no policy) still compiles for backward compat.

---

## Fallback seams audited (53R-1) and policy-wired (53R-2)

| Domain | File | Slice(s) | Pattern before 53R | Pattern after 53R |
|--------|------|----------|---------------------|-------------------|
| **ContextSnapshot** | `ContextSnapshotRelationalRead.cs` | CanonicalObjects, Warnings, Errors, SourceHashes | `RelationalFirstRead.ReadSliceAsync` (no policy) | Policy-aware `ReadSliceAsync` with slice names |
| **GoldenManifest** | `GoldenManifestPhase1RelationalRead.cs` | Assumptions, Warnings, Decisions | `RelationalFirstRead.ReadSliceAsync` (no policy) | Policy-aware `ReadSliceAsync` with slice names |
| **GoldenManifest** | `GoldenManifestPhase1RelationalRead.cs` | Provenance | **Ad-hoc** `if (count > 0) … else deserializeJson` | Routes through `policy.EvaluateFallback` |
| **FindingsSnapshot** | `FindingsSnapshotRelationalRead.cs` | Findings (full snapshot) | **Ad-hoc** `if (records.Count == 0) return JsonFallback` | Routes through `policy.EvaluateFallback` |
| **FindingsSnapshot** | `SqlFindingsSnapshotRepository.cs` | Findings (duplicate entry point) | **Ad-hoc** `if (recordCount == 0) return JsonFallback` | Routes through `policy.EvaluateFallback` + passes policy to `LoadRelationalSnapshotAsync` |
| **GraphSnapshot** | `GraphSnapshotRelationalRead.cs` | Nodes, Warnings, Edges, EdgeProperties (merge) | **Ad-hoc** null-override → mapper deserializes JSON | Mapper receives `fallbackPolicy`; edge-merge gated by policy |
| **GraphSnapshot** | `GraphSnapshotStorageMapper.cs` | Nodes, Edges, Warnings (when override is null) | `override is null → deserialize JSON` | `ResolveOverrideOrFallback` helper consults policy |
| **ArtifactBundle** | `ArtifactBundleRelationalRead.cs` | Artifacts | `RelationalFirstRead.ReadSliceAsync` (no policy) | Policy-aware `ReadSliceAsync` with slice name |
| **ArtifactBundle** | `ArtifactBundleRelationalRead.cs` | Trace (base) | Always deserializes JSON (scalar header fields) | **Unchanged** — intentional; trace base holds non-list scalar fields not yet relational |

---

## Files changed

### Production (53R-1 + 53R-2)

| File | Change |
|------|--------|
| `ArchiForge.Persistence/RelationalRead/PersistenceReadMode.cs` | **New** — enum: `AllowJsonFallback`, `WarnOnJsonFallback`, `RequireRelational` |
| `ArchiForge.Persistence/RelationalRead/RelationalDataMissingException.cs` | **New** — exception with `EntityType`, `EntityId`, `SliceName` |
| `ArchiForge.Persistence/RelationalRead/JsonFallbackPolicy.cs` | Upgraded: constructor takes `PersistenceReadMode` + `ILogger`; `EvaluateFallback` with full diagnostics; `ShouldFallbackToJson` backward compat |
| `ArchiForge.Persistence/RelationalRead/RelationalFirstRead.cs` | Policy-aware overload with `entityType`/`entityId` params; backward-compat overload preserved |
| `ArchiForge.Persistence/ContextSnapshots/ContextSnapshotRelationalRead.cs` | `HydrateAsync` accepts optional `fallbackPolicy`; all 4 slices use policy-aware `ReadSliceAsync` |
| `ArchiForge.Persistence/GoldenManifests/GoldenManifestPhase1RelationalRead.cs` | `HydrateAsync` accepts optional `fallbackPolicy`; provenance ad-hoc branch routes through policy |
| `ArchiForge.Persistence/Findings/FindingsSnapshotRelationalRead.cs` | `LoadRelationalSnapshotAsync` accepts optional `fallbackPolicy`; empty-records branch routes through policy |
| `ArchiForge.Persistence/Repositories/SqlFindingsSnapshotRepository.cs` | Constructor accepts optional `JsonFallbackPolicy`; `GetByIdAsync` routes through policy |
| `ArchiForge.Persistence/GraphSnapshots/GraphSnapshotRelationalRead.cs` | `HydrateAsync` accepts optional `fallbackPolicy`; edge-merge gated by policy |
| `ArchiForge.Persistence/Repositories/GraphSnapshotStorageMapper.cs` | `ToSnapshot` accepts optional `fallbackPolicy`; `ResolveOverrideOrFallback` helper |
| `ArchiForge.Persistence/ArtifactBundles/ArtifactBundleRelationalRead.cs` | `HydrateBundleAsync` accepts optional `fallbackPolicy` |
| `ArchiForge.Api/Configuration/ArchiForgeStorageServiceCollectionExtensions.cs` | Registers `JsonFallbackPolicy` singleton with `ILoggerFactory` |

### Tests

| File | Tests |
|------|-------|
| `ArchiForge.Persistence.Tests/JsonFallbackPolicyTests.cs` | 11 tests: default, allow/warn/require modes, `AllowFallback` property, `ShouldFallbackToJson` backward compat, warn logs, require throws with entity context |
| `ArchiForge.Persistence.Tests/RelationalFirstReadTests.cs` | 6 tests: relational exists, allow/warn/require modes, null policy, backward-compat overload |

### Docs

| File | Change |
|------|--------|
| `docs/JSON_FALLBACK_AUDIT.md` | Updated with 53R-2 modes, exception, and cutover steps |

---

## Out of scope for 53R

| Item | Reason |
|------|--------|
| **ArtifactBundle trace base JSON read** | Not a fallback — holds scalar fields with no relational column yet. Separate migration needed. |
| **GoldenManifest sections still JSON-primary** (`Metadata`, `Requirements`, `Topology`, `Security`, `Compliance`, `Cost`, `Constraints`, `UnresolvedIssues`) | Full JSON columns with no relational child tables. Phase-2 decomposition. |
| **`FindingPayloadJsonCodec` (per-finding payload sidecar)** | Typed JSON sidecar on relational rows, not a legacy fallback. |
| **`SqlDecisionTraceRepository` JSON columns** | Serialize/deserialize only; no relational child tables. |
| **Configuration-driven mode selection** | `PersistenceReadMode` is set in code at DI registration. Binding to `appsettings.json` or feature flags is a follow-up if needed. |
| **Per-slice mode overrides** | All slices share one mode today. If certain slices need `RequireRelational` before others, add a per-slice override map to `JsonFallbackPolicy`. |

---

## How to cut over (future)

1. Run `SqlRelationalBackfillService` across all environments.
2. Change DI registration to `PersistenceReadMode.WarnOnJsonFallback`; deploy; monitor logs for remaining fallback hits.
3. When logs are clean, change to `PersistenceReadMode.RequireRelational`; deploy; any un-backfilled rows throw `RelationalDataMissingException` with clear entity context and remediation advice.
4. Delete `*JsonFallback.cs` helpers, remove the backward-compat `ReadSliceAsync` overload, and remove the JSON column reads from `GraphSnapshotStorageMapper`.
