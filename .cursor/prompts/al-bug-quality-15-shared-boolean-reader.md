# ABQ-15 — One boolean reader; reject boolean synonyms on numeric/enum identity fields

**After ABQ-03 (shipped) and ABQ-14 preferred.** Do not re-open schemaVersion readers that already use `StrictSchemaVersionReader`. Do not change hunt-ready docs (ABQ-05).

## Goal

`ArchLucid.Core` has **one** shared boolean-synonym parser for fields that are actually booleans. Numeric, enum, and version **identity** fields reject `true` / `false` / `"on"` / `"off"` / `"true"` instead of coercing them to `0`/`1`. Tests that currently expect those synonyms to parse as numbers or enum ordinals **invert** to fail-closed, the same way ABQ-03 inverted schemaVersion tests.

## Why

ABQ-03 only wired `StrictSchemaVersionReader` into the three schemaVersion sites. The rest of Core still copies `TryParseBooleanString` (20 files at last count; **re-grep, do not trust this list**). That duplication is the fuel for the `/al-bug` coercion treadmill: each sibling “parity” hunt teaches another reader that `"on"` means `1`. `FindingJsonNumericReaders.TryReadInt32` still maps JSON boolean / `"true"` / `"on"` to `0`/`1`. `FindingEnforcementTierClassifier` still honors `properties.enforcementTier="on"` as Advisory. Leaving the copies guarantees the next hunt farms them.

## Context

Shared boolean helper already exists in one place — **reuse it**, do not add a 21st copy:

- `ArchLucid.Core/Findings/Serialization/FindingJsonStringReaders.cs` — `TryParseBooleanString`
- `ArchLucid.Core/Json/StrictSchemaVersionReader.cs` — pattern for **identity** fields (whole-number / named enum only)

Inventory (re-grep `TryParseBooleanString` under `ArchLucid.Core` before editing):

- `ArchLucid.Core/Billing/AzureMarketplace/MarketplaceQuantityReader.cs`
- `ArchLucid.Core/Runs/ArchitectureRunStatusTransitionTable.cs`
- `ArchLucid.Core/Persistence/RunHeaderAnchorJsonComparer.cs`
- `ArchLucid.Core/Hosting/QualityGateWarnOnlyProductionLikeConfigurationLint.cs`
- `ArchLucid.Core/CloudInventoryExtractor/CloudInventoryExtractorPackageZipValidator.SchemaReaders.cs`
- `ArchLucid.Core/Governance/ArchitectureRiskRegisterHumanReviewLabel.cs`
- `ArchLucid.Core/Governance/PolicyPacks/PolicyPackPriorityFloor.cs`
- `ArchLucid.Core/Governance/PolicyPacks/PolicyPackExpectationFacetParser.cs`
- `ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.TopLevelKeys.cs`
- `ArchLucid.Core/Findings/FindingEnforcementTierClassifier.cs`
- `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.Primitives.cs`
- `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.EnumReaders.cs`
- `ArchLucid.Core/Findings/Serialization/FindingJsonNumericReaders.cs`
- `ArchLucid.Core/Findings/Serialization/FindingJsonStringReaders.cs`
- `ArchLucid.Core/Costing/GcpSkuPricingParser.ScalarCoercion.cs`
- `ArchLucid.Core/Costing/GcpSkuPricingParser.TieredRate.cs`
- `ArchLucid.Core/Costing/AwsEc2OfferIndexParser.cs`
- `ArchLucid.Core/Agents/AgentModelExecutionProfileParser.cs`
- `ArchLucid.Core/Explanation/RunExplanationConfidenceCalloutBuilder.cs`
- `ArchLucid.Core/Explanation/RunExplanationAggregateJsonReader.TextTokens.cs`

`schemaVersion` sites that already call `StrictSchemaVersionReader` are **done**. Do not duplicate that type.

## What to build

1. Grep `TryParseBooleanString` and `JsonValueKind.True` under `ArchLucid.Core`. Classify **each** call site in the PR summary:

   | Class | Action |
   | --- | --- |
   | **Actual boolean field** (flags, warn-only, enabled, matchers that are documented as bool) | Delete the local copy; call the single shared reader. Keep tests that `"on"`/`true` mean boolean true. |
   | **Numeric / enum / version identity** (schemaVersion already done; quantities-as-counts; enum ordinals including `enforcementTier`; confidence integers) | Stop calling the boolean parser. Reject boolean JSON and `"on"`/`"true"`/`"off"`. Invert tests that asserted those succeed. |

2. Put the shared boolean reader in **one** file (prefer existing `FindingJsonStringReaders.TryParseBooleanString`, or move it to `ArchLucid.Core/Json/` next to `StrictSchemaVersionReader` if Core.json is the cleaner owner). Every remaining boolean site calls that one method. Delete private copies.

3. For identity fields, prefer a small shared numeric reader (reject boolean kinds and boolean strings; accept JSON number and digit strings already required by tests). `FindingJsonNumericReaders.TryReadInt32` / `TryReadFiniteDouble` / decimal path must **not** coerce `true`→`1`. `FindingJsonConverter.EnumReaders` must **not** map `JsonValueKind.True` to ordinal 1 unless the enum field is documented as a boolean (it is not).

4. Invert treadmill facts, including (names may have drifted — grep):
   - `ClassifyFinding_honors_on_synonym_enforcement_tier_property`
   - `ClassifyFinding_honors_string_encoded_boolean_enforcement_tier_property`
   - any `FindingJsonConverter` / numeric-reader tests that pass `"on"` / `true` as int/enum

   Replacements: those payloads are **invalid** (classifier ignores the property and uses non-boolean rules, **or** converter throws `JsonException`). Pick one per type and test it. Do not keep both “on means Advisory” and “on is rejected.”

5. Tests — scoped to the readers you touch, for example:

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~FindingJson|FullyQualifiedName~FindingEnforcementTierClassifier|FullyQualifiedName~MarketplaceQuantity|FullyQualifiedName~StrictSchemaVersion"
```

Add filters for every other type you change. After invert, grep `ArchLucid.Core.Tests` for `"on"` next to numeric/enum facts and confirm none still expect success on identity fields.

6. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`

## Acceptance criteria

- `rg TryParseBooleanString ArchLucid.Core` shows **one** definition and only boolean-field callers (plus tests).
- `"schemaVersion": true` still fails (ABQ-03; do not regress).
- `"enforcementTier": "on"` / `true` is not Advisory-by-synonym.
- `TryReadInt32` on JSON `true` or `"on"` returns false / throws at the converter, not `1`.
- PR table lists every former copy: boolean-keep vs identity-reject.
- No new accepted synonym token.

## Constraints

- Do not blindly reject booleans on fields that are actually booleans.
- Do not change hunt ledger scoring (ABQ-06/16).
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
- Each new type in its own file. Check nulls. Prefer concrete types over `var`.
