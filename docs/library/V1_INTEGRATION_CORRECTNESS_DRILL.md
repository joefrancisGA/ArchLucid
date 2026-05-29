> **Scope:** Contributor-reference — V1 HTTP integration correctness drill against a running API.

# V1 integration correctness drill

**Audience:** Release owners, integrators, and pilot leads validating documented API semantics on a staged or local API.

**Purpose:** One scripted pass over the V1 happy path and selected negative paths, with **PASS / WARN / HOLD** rows, **correlation IDs**, and **Problem Details `type`** values. Complements the broader two-run [`V1_RC_DRILL.md`](V1_RC_DRILL.md) without replacing OpenAPI snapshot tests.

**Last reviewed:** 2026-05-28

---

## When to run

| When | Why |
| --- | --- |
| Before RC sign-off | Confirms authority vs coordinator lifecycle, commit idempotency, and error contracts on the target URL |
| After API contract changes | Catches integration misuse before Playwright or pilot proof |
| Staging smoke adjunct | Faster than full `live-api-*.spec.ts`; no UI required |

**Prerequisites:** API up, SQL migrated, auth configured (`DevelopmentBypass`, JWT, or ApiKey). No V1.1 connectors.

---

## Command

From repo root (API already listening):

```powershell
./scripts/v1-integration-correctness-drill.ps1 `
  -ApiBaseUrl http://localhost:5128 `
  -OutputDirectory artifacts/v1-integration-correctness-drill
```

Optional auth (same as [`v1-rc-drill.ps1`](../../scripts/v1-rc-drill.ps1)):

```powershell
./scripts/v1-integration-correctness-drill.ps1 -ApiBaseUrl https://staging.example -BearerToken '<jwt>'
./scripts/v1-integration-correctness-drill.ps1 -ApiBaseUrl https://staging.example -ApiKey '<key>'
```

Exit code **0** when overall disposition is **PASS** or **WARN**; **1** when any row is **HOLD**.

---

## Artifacts

| File | Contents |
| --- | --- |
| `v1-integration-correctness-drill.json` | Machine-readable rows + `integrationModelObserved` |
| `v1-integration-correctness-drill.md` | Human-readable table for release notes |

Each row includes: **route**, **expectedStatus**, **actualStatus**, **correlationId**, **problemType** (on errors), **disposition**, and optional **integrationModel** note.

---

## Steps exercised

| Step | Route family | What it proves |
| --- | --- | --- |
| Health | `GET /health/ready` | Target reachable |
| Create | `POST /v1/architecture/request` | Happy-path create |
| Classify lifecycle | `GET /v1/architecture/run/{runId}` | **Authority pipeline** if committed without `execute`; else **legacy coordinator** after `execute` + poll |
| Commit | `POST …/commit` (initial when needed) | Coordinator path completion |
| Idempotent commit | Second `POST …/commit` | **200** retry-safe per [`API_CONTRACTS.md`](API_CONTRACTS.md) |
| Artifacts | `GET /v1/artifacts/manifests/{manifestId}` (+ descriptor) | Listing and metadata |
| Explain | `GET /v1/explain/runs/{runId}/aggregate` | Aggregate explanation |
| First value | `GET /v1/pilots/runs/{runId}/first-value-report` | Sponsor Markdown |
| Negative run | `GET …/run/{missing}` | **404** + `#run-not-found` |
| Negative manifest | `GET /v1/artifacts/manifests/{missing}` | **404** + `#manifest-not-found` or `#resource-not-found` |

---

## Authority vs coordinator

The drill **records** which model occurred (`integrationModelObserved`):

- **`authority-pipeline`** — golden manifest present without calling `POST …/execute`.
- **`legacy-coordinator`** — `execute` (and usually `commit`) required.

Do not call `execute` after authority auto-commit unless you are intentionally testing mixed-model behavior (see API_CONTRACTS anti-pattern note).

---

## Related documents

| Doc | Use |
| --- | --- |
| [API_CONTRACTS.md](API_CONTRACTS.md) | Authority vs coordinator, commit idempotency, Problem Details |
| [V1_RC_DRILL.md](V1_RC_DRILL.md) | Two-run compare, replay, export ZIP |
| [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) | Release gate checkboxes |
| [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md) | Playwright live-api journey (UI + API) |
