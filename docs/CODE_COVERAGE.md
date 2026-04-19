# Code coverage (CI and local)

## Objective

Describe how **line/branch coverage** is collected in CI and how to reproduce reports locally.

## Current gates

The **full regression** job in **`.github/workflows/ci.yml`** merges Cobertura output and enforces:

- **Line coverage ≥ 76%** (merged product assemblies)
- **Branch coverage ≥ 60%**
- Per-package line floors (see **`scripts/ci/assert_merged_line_coverage_min.py`** invocation in the workflow), with **`ArchLucid.Jobs.Cli`** omitted from the per-package line gate via **`--skip-package-line-gate`**

Raising the global line gate further (for example toward **79%** line / **63%** branch / **63%** per-package) requires a deliberate effort: run a local or CI **`coverage-report-full`** artifact, identify low assemblies, add tests, then bump the positional line argument, **`--min-branch-pct`**, and **`--min-package-line-pct`** in **`ci.yml`** in the same change (and remove or narrow package skips).

## Local run (merged HTML)

From repo root (after a **Release** build of tests):

```bash
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage" --results-directory ./coverage-raw
dotnet tool run reportgenerator "-reports:./coverage-raw/**/coverage.cobertura.xml" "-targetdir:./coverage-report" "-reporttypes:HtmlSummary"
```

Open **`coverage-report/index.html`**.

## Exclusions

See **`docs/coverage-exclusions.md`** and **`coverage.runsettings`** (generated OpenAPI client, templates, etc.).

## Related

- **`docs/TEST_STRUCTURE.md`**
- **`docs/TEST_EXECUTION_MODEL.md`**
- **`docs/STRYKER_RATchet_TARGET_72.md`** (mutation score ratchet — orthogonal to line coverage)
