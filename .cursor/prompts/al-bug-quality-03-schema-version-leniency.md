# ABQ-03 — Roll back schemaVersion token-leniency treadmill

**Do not fork ABQ-01/02/04.** This prompt is only JSON **schema version** readers that `/al-bug` loosened to accept booleans, `"on"`/`"off"`, and other non-version tokens, then copied across siblings as “parity.”

## Goal

`schemaVersion` means a whole-number schema id (typically `0` / `1` / current). Accept JSON number `1`, string `"1"`, and (if the contract documents a default) **omitted** property → current version. Reject `true`, `false`, `"on"`, `"off"`, `"1.0"`-as-boolean, and other synonym tokens **unless** a versioned contract file already required that before 2026-08-23. Do not add a new accepted token to make a hunt test pass.

## Why

Ledger hits on 2026-09-03 taught `RunAuthorityPipelineDeadLetterDetection` and `AzureExtractorManifestSchemaUpgrader` to treat `schemaVersion: true` and `"on"` as version 1, then “parity” hunts propagated `TryParseBooleanString` into sibling readers. For a product aimed at professional architects, silently accepting a malformed manifest version is a defect the hunts *introduced*. String `"1"` from a sloppy serializer can stay; boolean schema versions cannot.

## Context

Start here (do not boil the ocean of every `TryParseBooleanString` in the repo):

- `ArchLucid.Core/Runs/RunAuthorityPipelineDeadLetterDetection.cs`
- `ArchLucid.Core/AzureExtractor/AzureExtractorManifestSchemaUpgrader.cs`
- `ArchLucid.Core/AzureExtractor/AzureExtractorPackageZipValidator.SchemaReaders.cs`

Inventory **callers of `TryParseBooleanString` used on a property named schemaVersion** (grep `schemaVersion` near those helpers). If a sibling reader (`AzureExtractorPackageZipValidator`) already accepted boolean schema versions **before** the treadmill, do not silently diverge — pick **strict integer** as the contract and update both, with tests that boolean tokens **fail closed** (upgrade/validate rejected or “invalid schema,” not coerced to v1).

Leave boolean synonym parsing in place for **actual boolean fields** (flags, meters, SKU matchers). ABQ-03 is not “delete `TryParseBooleanString` everywhere.”

## What to build

1. Grep `schemaVersion` + `TryParseBooleanString` / `JsonValueKind.True` in `ArchLucid.Core`. List the readers you will change in the PR summary.
2. For each schema-version reader: accept `JsonValueKind.Number` whole numbers in range; accept string digits (`"0"`, `"1"`) if already present and tests need wire compatibility; default missing property only where XML docs / contract default is already `1`.
3. Reject `JsonValueKind.True`/`False`, `"on"`/`"off"`/`"true"` as schema versions. Tests that asserted those succeed must **invert** to invalid/rejected (or no-upgrade), not stay green via more coercion.
4. Do **not** “fix” a sibling by copying boolean acceptance. If two readers disagree, the strict one wins.
5. Keep PascalCase property lookup / omitted-property default **only** if you can cite the contract default. Whitespace-padded `" 1 "` is optional; do not spend this prompt on padding hunts.
6. Tests: invert the 2026-09-03 boolean/`on` facts; keep string `"1"` / numeric `1` passing.

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~RunAuthorityPipelineDeadLetterDetection|FullyQualifiedName~AzureExtractorManifestSchemaUpgrader|FullyQualifiedName~AzureExtractorPackageZipValidator"
```

7. One scoped compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'`

## Acceptance criteria

- `{"schemaVersion":true,"failureClass":"PipelineDeadLetter"}` does **not** count as a supported schema.
- `"schemaVersion":"on"` does **not** count as version 1.
- Numeric `1` and string `"1"` still work where they worked for honest payloads.
- PR summary names every reader changed and every boolean-schema test inverted.
- No new `TryParseBooleanString` call added on a version field.

## Constraints

- Do not loosen `FindingJsonConverter` enums, cost parsers, or GCP/AWS SKU flags in this prompt.
- Do not treat `null` schemaVersion as a hunt to expand — either document “omitted/null → default 1” from an existing contract or reject null. Pick one and test it; do not accept both `true` and `null` as “forward compatible.”
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
