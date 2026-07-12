# Technology consistency golden corpus

Deterministic **Technology Ledger** snapshots and artifact prose fixtures for regression-testing:

- `TechnologyConsistencyFindingEngine` (Prompt 6)
- `TechnologyLedgerArtifactLinter` (Prompt 7)

Unlike `tests/eval-corpus/` (agent finding recall), these scenarios are **offline**, **PR-safe**, and assert stable rule titles / lint rule ids only.

## Corpus resolution

Test projects copy this folder to build output as `technology-consistency-corpus/` (see `CopyToOutputDirectory` in `ArchLucid.Application.Tests` and `ArchLucid.ArtifactSynthesis.Tests`). Tests resolve the corpus via `AppContext.BaseDirectory/technology-consistency-corpus`.

## Add a scenario

1. Create a directory under `finding-engine/` or `artifact-lint/`.
2. Add required files (`ledger.json` + `expected.json`, or revision v1/v2 files, or `artifact.md` for lint).
3. Register the path in `manifest.json` (deterministic order).
4. Run local verification (below) and `python scripts/ci/assert_technology_consistency_corpus.py`.

### `ledger.json`

Array of `TechnologyLedgerEntry` objects — camelCase keys, string enum names (`role`, `status`, `source`, `providerFamily`). Use fixed `runId` `cccccccccccccccccccccccccccccccc` per scenario.

### `expected.json` (finding engine)

```json
{
  "mode": "WarnOnly",
  "findingTitles": ["ConflictingChosenProviderFamily"],
  "minimumCount": 1,
  "maximumCount": 1
}
```

Coherent baselines: `"findingTitles": []`, `"maximumCount": 0`.

### `expected.json` (artifact lint)

```json
{
  "mode": "WarnOnly",
  "ruleIds": ["ProseHyperscalerFamilyMismatch"]
}
```

## Run locally

```powershell
python scripts/ci/assert_technology_consistency_corpus.py
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~TechnologyConsistencyGoldenCorpus"
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter "FullyQualifiedName~TechnologyConsistencyArtifactGoldenCorpus"
python -m unittest scripts/ci/tests/test_assert_technology_consistency_corpus.py
```
