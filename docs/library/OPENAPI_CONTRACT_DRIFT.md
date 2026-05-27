> **Scope:** Contributor-reference — OpenAPI contract drift (CI and local workflow) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# OpenAPI contract drift (CI and local workflow)

## 1. Objective

Prevent accidental HTTP surface changes: the generated OpenAPI document for **v1** (`GET /openapi/v1.json`) must match the CI-controlled baseline, so clients, APIM imports, and generated stubs do not silently diverge.

## 2. Assumptions

- The canonical contract check uses **Microsoft.AspNetCore.OpenApi** output at **`GET /openapi/v1.json`** (not Swashbuckle’s `/swagger/v1/swagger.json`, which is explorer-only and covered by separate smoke tests).
- **Azure APIM:** set **`apim_openapi_spec_url`** to **`https://<api-host>/openapi/v1.json`** (`infra/terraform/README.md`), not `/swagger/v1/swagger.json`.
- Contributors run **.NET** tests before pushing; CI runs the same **fast core** filter as local “corset” runs.

## 3. Constraints

- Snapshot baselines are **large JSON** CI fixtures; review diffs carefully (noise vs intentional contract change).
- Regenerating the baseline without a deliberate API change is a **process failure** — revert or fix the accidental route/schema change instead.

## 4. Architecture overview

**Nodes:** `ArchLucid.Api` host, `OpenApiContractSnapshotTests`, committed CI baseline, generated CI artifact.

**Edges:** Test issues `GET /openapi/v1.json` → compares **canonicalized** JSON (sorted object keys; stable `tags` ordering) to `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` so Linux CI and Windows dev machines agree. CI also uploads the generated canonical document as **`openapi-v1-generated-canonical`** for review evidence.

**Flow:** Drift → test fails → developer regenerates the CI baseline only after intentional API change → commit baseline + code together; downstream product artifacts are generated from the canonical OpenAPI contract.

## 5. Component breakdown

| Piece | Role |
|--------|------|
| `OpenApiContractSnapshotTests` | xUnit test, trait `Suite=Core` |
| `openapi-v1.contract.snapshot.json` | Expected OpenAPI v1 CI baseline |
| `openapi-v1-generated-canonical` workflow artifact | Generated canonical OpenAPI JSON from the fail-fast CI job; evidence for review/debugging, not a published product asset |
| `scripts/ci/check_openapi_contract_snapshot.sh` (and `.ps1`) | Local / CI **same** build+test as the fail-fast gate (build `ArchLucid.Api.Tests` only, then single test FQN) |
| `scripts/git-hooks/pre-push` (+ `Install-GitHooks.ps1` / `install-git-hooks.sh`) | Optional **pre-push** gate: same check before refs leave your clone when outgoing commits touch API-contract paths (see Operational considerations) |
| `.github/workflows/ci.yml` job **openapi-contract-snapshot** | Runs **before** **dotnet-fast-core** (`needs`); surfaces drift **without** waiting for SBOM/Python guards/full-solution corset guards |
| `.github/workflows/ci.yml` job **dotnet-fast-core** | Runs `Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord` (still includes this test for coverage merge parity) |

## 6. Data flow

1. WebApplicationFactory starts the API with test configuration.
2. Client requests `/openapi/v1.json`.
3. Response is parsed and compared to the baseline using `OpenApiJsonCanonicalizer` (object key order + `tags` array normalization; not a semantic OpenAPI diff engine).
4. When `ARCHLUCID_OPENAPI_SNAPSHOT_ARTIFACT_PATH` is set, the generated canonical JSON is written for CI artifact upload.
5. Mismatch fails the build.

## 7. Security model

- No secrets in the snapshot; the document describes public routes and schemas.
- Auth schemes in the document depend on `ArchLucidAuth:Mode` at document generation time (see `API_CONTRACTS.md`).

## 8. Operational considerations

**CI regenerate (recommended when local builds are slow):**

1. **Automatic (same-repo PRs):** Push API-surface changes; workflow **Refresh OpenAPI v1 snapshot** (`.github/workflows/openapi-snapshot-refresh.yml`) runs on pull requests when OpenAPI-relevant paths change, regenerates the CI baseline on Linux, and commits back to the PR branch when needed.
2. **Manual:** Actions → **Refresh OpenAPI v1 snapshot** → **Run workflow** on your branch. Optional inputs: regenerate TypeScript api-types and/or the .NET NSwag client.

**Local regenerate (after you intentionally change routes or OpenAPI metadata):**

```bash
# Repo root — regenerate + verify (Git Bash / Linux / macOS)
bash scripts/ci/update_openapi_contract_snapshot.sh
```

```powershell
# Repo root (PowerShell)
.\scripts\ci\update_openapi_contract_snapshot.ps1
```

Low-level (snapshot file only):

```powershell
$env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT = "1"
.\scripts\ci\check_openapi_contract_snapshot.ps1
```

Then commit the updated `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` (or let CI commit it on the PR). Treat this file as a review baseline only; integrators and release processes use `GET /openapi/v1.json` and generated SDK outputs.

**Downstream generated clients (same PR as intentional contract changes):**

1. **.NET SDK:** `dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj` — NSwag regenerates `Generated/ArchLucidApiClient.g.cs` from the snapshot (`ArchLucid.Api.Client/README.md`).
2. **TypeScript (operator UI):** from `archlucid-ui/`, run `npm run generate:api-types` — refreshes `src/lib/api-types.generated.ts` from the same snapshot (see `scripts/ci/assert_api_types_in_sync.sh`).
3. **Docs:** update operator/integration docs when behavior or DTO semantics change (quality gate, agent evaluation, golden cohort, configuration tables linked from `ConfigurationKeyCatalog`).

Commit baseline + regenerated clients + doc edits together so CI (`openapi-contract-snapshot`, `assert_api_types_in_sync` where wired) stays green.

**Optional git pre-push gate:** Run once from repo root: `.\scripts\git-hooks\Install-GitHooks.ps1` (Windows) or `bash scripts/git-hooks/install-git-hooks.sh` (Unix). That sets `core.hooksPath` to `scripts/git-hooks` so `pre-push` runs the same snapshot check as CI when your outgoing commits touch paths under the API dependency closure (for example `ArchLucid.Api/`, `ArchLucid.Application/`, `ArchLucid.Persistence/`, `schemas/`, or central MSBuild files). Skip one push: `ARCHLUCID_SKIP_OPENAPI_PRE_PUSH=1` (Bash) or `$env:ARCHLUCID_SKIP_OPENAPI_PRE_PUSH = "1"` (PowerShell). Always run the check on every push (ignore path filter): `ARCHLUCID_OPENAPI_PRE_PUSH=all`. If a legitimate change did not match the filter and CI still failed, extend the patterns in `scripts/git-hooks/pre-push`.

**CI:** Job **openapi-contract-snapshot** runs parallel with Terraform validation and gates **dotnet-fast-core** — snapshot drift surfaces before the corset **`dotnet build` ArchLucid.sln** path. Job **“.NET: fast core (corset)”** still runs the snapshot test inside the broader Core suite so coverage stays contiguous. See `docs/library/TEST_EXECUTION_MODEL.md` for tier mapping.

**Cost / scalability:** One HTTP request per test run; negligible.

**Reliability:** If the test is flaky, check for non-deterministic schema ordering or environment-specific OpenAPI filters; the snapshot test applies normalization specifically to avoid brittle ordering issues where implemented.

## 9. Adding v2 or additional snapshots

When a **v2** OpenAPI document is introduced:

1. Add a parallel test class (e.g. `OpenApiV2ContractSnapshotTests`) and a second snapshot file.
2. Register the document in startup and ensure `GET /openapi/v2.json` (or your chosen path) is stable.
3. Document the regenerate command in this file and in `TEST_EXECUTION_MODEL.md`.

## 10. Related documentation

- `docs/library/API_CONTRACTS.md` — canonical **`/openapi/v1.json`** posture and **Changing the HTTP contract (PR checklist)**.
- `docs/TEST_EXECUTION_MODEL.md` — Core suite and CI mapping.
- `docs/NEXT_REFACTORINGS.md` — Historical backlog context.
