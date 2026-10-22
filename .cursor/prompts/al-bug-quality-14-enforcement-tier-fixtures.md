# ABQ-14 — Restore `enforcementTier` on Finding JSON fixtures (wire contract)

**Do not fork ABQ-03/15.** This prompt is the Core finding **wire contract** plus the stale unit fixtures that no longer satisfy it. It is not a hunt-quality / ledger prompt and must not run `/al-bug`.

## Goal

`ArchLucid.Core.Tests` `FindingJsonConverterTests` is green. Production `FindingJsonConverter.Read` already requires `enforcementTier` (top-level JSON **or** `properties.enforcementTier`). Stale fixtures that omit it must stop failing with `enforcementTier is required.` Round-trip and missing-field tests must throw `JsonException` with the documented messages, not `KeyNotFoundException`.

## Why

`FindingJsonConverter` (around the `if (!enforcementTierResolved)` throw) and sibling `ArchitectureFindingJsonConverter` already treat `enforcementTier` as required. Wave-21 updated some architecture-finding fixtures; `FindingJsonConverterTests.cs` still has **59** `const string json` fixtures and only a handful include `enforcementTier`. That is the remaining Core unit-test red on this branch (dozens of failures, almost all that exact message). Scoring / ledger work cannot make those tests green.

This is a **wire-contract** choice, not a hunt. Do not invent a new default token (`"on"`, `true`, ordinal `1` as a boolean synonym). ABQ-15 owns boolean-synonym collapse.

## Context

- `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.cs` — required-field throw; fallback is already: top-level `enforcementTier`, else `Finding.Properties[FindingPropertyKeys.EnforcementTier]`
- `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.EnumReaders.cs` / `FindingJsonNumericReaders.cs` — do **not** add boolean→ordinal coercion here (ABQ-15)
- `ArchLucid.Contracts/Findings/ArchitectureFindingJsonConverter.cs` — already required; do not diverge
- `ArchLucid.Core/Findings/FindingEnforcementTierClassifier.cs` — classifier for **live** findings before persist; not a deserializer default unless you explicitly pick Option B
- `ArchLucid.Core.Tests/Findings/Serialization/FindingJsonConverterTests.cs` — the failing class
- `ArchLucid.Contracts/Findings/FindingPropertyKeys.cs`

After deserialize, the converter writes `finding.Properties[FindingPropertyKeys.EnforcementTier] = finding.EnforcementTier.ToString()` (enum name such as `Advisory`, not the inbound token `"1"`).

## Contract decision (pick one; default is A)

| Option | Behavior | When to choose |
| --- | --- | --- |
| **A (default)** | Keep `enforcementTier` **required** on read. Add `"enforcementTier": "Advisory"` (or the tier the test is actually asserting) to every fixture that currently omits it. Tests that *intend* a missing tier keep omitting it and must assert `JsonException` `*enforcementTier is required*`. | Production already throws. Architecture converter already requires it. Honest wire. |
| **B** | When both top-level and properties-bag are absent, infer via `FindingEnforcementTierClassifier.ClassifyFinding` (or Advisory for baseline policy-rule prefixes) instead of throwing. Add tests for inferred Advisory vs PolicyViolation. Keep throwing on **present-but-invalid** tokens (`"99"`). | Only if you can cite persisted findings / golden corpus payloads that lack the field and must still load. Document that citation in the PR. |

**Default without a cited persist-compat payload is A.** Do not silently pick B to avoid editing fixtures. Do not accept boolean / `"on"` as a tier in this prompt.

## What to build

1. Grep `FindingJsonConverterTests.cs` for JSON objects missing `"enforcementTier"`. List how many you will update vs how many are negative tests.
2. Execute the chosen option:
   - **A:** add the field to honest payloads; keep / add one test that omission throws `JsonException` with `enforcementTier is required.`
   - **B:** implement infer-on-absent only; do not infer when the property is present and invalid.
3. Fix sibling assertion shapes in the same class (do not hide them):
   - `Deserialize_properties_numeric_values_preserve_string_entries` currently expects `Properties["enforcementTier"] == "1"` after `"enforcementTier": 1` in the bag. Converter write-back is `ToString()` → `"Advisory"`. Update the assertion to `"Advisory"` **unless** you deliberately change write-back (do not; callers already persist the enum name).
   - `Deserialize_withoutFindingId_throwsJsonException` must still throw `JsonException` `*findingId is required*` (add `enforcementTier` so this test does not fail first on the tier). If `ReadRequiredString` throws `KeyNotFoundException` on a missing key, wrap it as `JsonException` — that is a real converter defect, in scope.
4. Do **not** loosen `"99"` / undefined ordinal tests; those already exist and must keep throwing.
5. Tests:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~FindingJsonConverterTests"
```

6. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`

## Acceptance criteria

- `FindingJsonConverterTests` is fully green.
- Omitted `enforcementTier` either throws (A) or infers via the classifier with tests (B); the PR states which.
- Numeric `1` still maps to `FindingEnforcementTier.Advisory` where tests already cover that.
- Properties-bag after read stores the enum **name**, matching write-back.
- Missing `findingId` throws `JsonException`, not `KeyNotFoundException`.
- No new `TryParseBooleanString` on this field.

## Constraints

- Do not collapse duplicated boolean parsers (ABQ-15).
- Do not edit the hunt ledger, picker, or `/al-bug` commands.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
