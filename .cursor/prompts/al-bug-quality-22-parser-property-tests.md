# ABQ-22 — Property / fuzz tests for strict JSON and token readers

**After ABQ-03 and ABQ-15 (shipped).** Do not re-open boolean synonym acceptance on identity fields. Do not change hunt-ready docs (ABQ-05). Do not hunt.

## Goal

`ArchLucid.Core` identity readers (`StrictSchemaVersionReader`, numeric/enum finding readers, zip schema readers) have **FsCheck (or equivalent) properties** that (1) boolean JSON and boolean-synonym strings never parse as schema versions / enum ordinals / counts, and (2) well-formed whole numbers and documented enum names still round-trip. Failures are **crashes or inconsistent accept/reject**, not a new synonym to allowlist.

## Why

Example tests encode a handful of `"on"` / `true` cases. After ABQ-15 those examples expect **reject**. The remaining bugs are malformed Unicode, huge numbers, `-0`, `1e2`, mixed-case enum fragments, and nested tokens that **throw** or **accept inconsistently** across sibling readers. Property tests are a legitimate `/al-bug` hunting ground that is not a phrase-list treadmill.

## Context

Reuse existing test infrastructure:

- `ArchLucid.TestSupport/FsCheckV3Compat.cs` + `FsCheckV3GlobalUsings.cs` — FsCheck 3.x shims (`DefaultArbFacade`)
- `ArchLucid.Core/Json/StrictSchemaVersionReader.cs`
- `ArchLucid.Core/Json/JsonBooleanStringReader.cs` — **boolean fields only**; do not assert identity readers call it
- `ArchLucid.Core/Findings/Serialization/FindingJsonNumericReaders.cs`
- `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.EnumReaders.*.cs`
- `ArchLucid.Core.Tests/Findings/Serialization/FindingJsonConverterTests.cs` — example facts; keep them
- Existing FsCheck usage elsewhere in `*.Tests` — copy that project’s package/style, do not add a second property library

Grep `FsCheck` / `Property` under `ArchLucid.Core.Tests` and `ArchLucid.TestSupport` before inventing a new pattern.

## What to build

1. **Generators** (own file(s) under `ArchLucid.Core.Tests`, one type per file): JSON boolean kinds; synonym strings (`true`/`false`/`on`/`off`/`yes`/`no`/`enabled`/`disabled` plus case/whitespace variants); whole-number ints in a safe range; documented enum names for `FindingSeverity` / `FindingEnforcementTier` / `FindingHumanReviewStatus`. Do **not** generate customer data.

2. **Properties** (own test class files):

   | Reader | Property |
   | --- | --- |
   | `StrictSchemaVersionReader.TryReadSchemaVersion` | Boolean kind and synonym strings → `false`; digit strings / JSON numbers that are finite whole ≥ 0 → `true` with that int (cap magnitude so `int` does not overflow — document the cap) |
   | `FindingJsonNumericReaders.TryReadInt32` / `TryReadFiniteDouble` / `TryReadDecimal` | Boolean kind and synonym strings → `false` (not `0`/`1`) |
   | `JsonBooleanStringReader.TryParseBooleanString` | Synonym table still true/false as **boolean**; unrelated tokens → `false` |
   | Enum readers via `FindingJsonConverter` deserialize **or** the internal read helpers if tests can see them | Boolean JSON / `"on"` → `JsonException` or default-ignore consistent with current converter tests; named enums still deserialize |

   Prefer testing **public** APIs (`StrictSchemaVersionReader`, converter deserialize, `JsonBooleanStringReader`). Internal numeric readers: use `InternalsVisibleTo` if Core.Tests already has it; otherwise only public surfaces.

3. **Keep example tests.** Properties complement ABQ-15 inverted facts; they do not replace them.

4. **Do not** add a new accepted synonym if a property finds one still accepted on an identity field — **that is a product bug**: fix the reader to reject (ABQ-15 intent), add an example test, then keep the property. If the field is a documented boolean, keep acceptance and document it in the PR table.

5. Tests to run:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~StrictSchemaVersion|FullyQualifiedName~JsonBooleanString|FullyQualifiedName~FindingJsonNumeric|FullyQualifiedName~FindingJsonConverter"
```

If you add a dedicated `*PropertyTests.cs`, filter that name too.

6. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'` (and the test project if the script allows `-ProjectPath` on tests — otherwise `dotnet test` above is the compile).

## Acceptance criteria

- At least one property file runs in Core.Tests and uses the existing FsCheck 3 shim (or the same FsCheck style already in-repo).
- Properties **fail** (test failure) if identity readers start accepting `"on"` again.
- No new NuGet property library unless FsCheck is somehow unavailable in Core.Tests — if you must add a package, it must already appear in `Directory.Packages.props`.
- PR lists generators and which APIs they cover.

## Constraints

- Do not weaken ABQ-15 identity rejection.
- Do not hunt via `/al-bug`.
- Working-tree safety. Each new type in its own file. Check nulls. Prefer concrete types over `var`. No `ConfigureAwait(false)` in tests.
- Do not generate unbounded JSON documents that hang CI — cap string length and graph depth.
