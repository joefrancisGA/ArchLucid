> **Scope:** V1 buyer/architect automation handoff — REST, CLI, OpenAPI, exports, and SCIM only. First-party ITSM/chat/docs connectors are **V1.1**.

# V1 automation handoff pack

**Audience:** Integration engineers wiring ArchLucid into CI/CD, IT automation, or internal orchestration without first-party Jira, ServiceNow, Confluence, Slack, or Teams connectors.

**Last reviewed:** 2026-06-12

**Machine-readable contracts:** [`scripts/ci/data/v1_integration_starter_contracts.v1.json`](../../scripts/ci/data/v1_integration_starter_contracts.v1.json) (validated by `scripts/ci/check_v1_integration_starter_contracts.py` against the OpenAPI snapshot).

**V1.1 boundary:** ServiceNow, Jira, Confluence, Slack, Microsoft Teams, CloudEvents webhooks, and MCP agent-tool membranes are **not** V1 buyer-contract obligations. See [`INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) and [`V1_SCOPE.md`](V1_SCOPE.md) Â§2.8 / Â§2.13–Â§2.15.

---

## End-to-end workflow (V1 surfaces)

| Phase | Architect workspace | REST (OpenAPI) | CLI |
| --- | --- | --- | --- |
| Create review | `/reviews/new` | `POST /v1/architecture/request` | `archlucid architecture request` or `archlucid run create` |
| Execute / observe | Review detail | `POST /v1/architecture/review/{runId}/execute` then poll `GET /v1/architecture/review/{runId}` | `archlucid architecture execute <runId>` |
| Finalize | Review detail → **Finalize** (API/CLI `commit`) | `POST /v1/architecture/review/{runId}/finalize` | `archlucid architecture commit <runId>` |
| Export artifacts | Review detail → Export | `GET /v1/artifacts/runs/{runId}/export` | `archlucid artifacts export <runId>` |
| Compare runs | Compare workspace | `GET /v1/authority/compare/runs?leftRunId=…&rightRunId=…` | Compare via REST (CLI wrapper optional) |
| ROI summary | Value report / sponsor dashboard | `GET /v1/architecture/review/{runId}/roi` Â· optional `GET /v1/analytics/roi` | ROI via REST |

Canonical API surface: [`API_CONTRACTS.md`](API_CONTRACTS.md) Â· OpenAPI: `GET /openapi/v1.json` Â· generated client: `ArchLucid.Api.Client`.

---

## Authentication

| Mode | When to use | Header |
| --- | --- | --- |
| **Entra ID / OIDC bearer** | Architect sessions, human-driven automation | `Authorization: Bearer <access_token>` |
| **API key** | Unattended CI and scripts | `X-ArchLucid-Api-Key: <key>` (see [`SECURITY.md`](contributor-reference/SECURITY.md)) |

Capture **`X-Correlation-ID`** on every failure for support handoff.

---

## Step 1 — Create review

```bash
export BASE="https://staging.example"
export TOKEN="<bearer-or-use-api-key>"

curl -sS -X POST "$BASE/v1/architecture/request" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: pilot-create-001" \
  -d '{
    "systemName": "claims-intake-modernization",
    "projectId": "default",
    "description": "V1 automation handoff — sanitized example"
  }'
```

CLI equivalent:

```bash
archlucid architecture request --json \
  --system-name "claims-intake-modernization" \
  --description "V1 automation handoff"
```

**Problem Details (RFC 7807):** `400` validation failures return `application/problem+json` with `type`, `title`, `status`, `detail`, and `traceId`.

---

## Step 2 — Execute and observe

```bash
export RUN_ID="<from-create-response>"

curl -sS -X POST "$BASE/v1/architecture/review/$RUN_ID/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: pilot-execute-001"
```

Poll until status is `ReadyForCommit` or `Committed`:

```bash
curl -sS "$BASE/v1/architecture/review/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**409 / 422:** Run not executable — see [`QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md).

---

## Step 3 — Finalize (API `commit`)

```bash
curl -sS -X POST "$BASE/v1/architecture/review/$RUN_ID/commit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: pilot-commit-001"
```

Success: architecture package / `CurrentManifestVersion` populated; artifacts retrievable on run detail.

---

## Step 4 — Export finalized artifacts

```bash
curl -sS -o review-export.zip \
  "$BASE/v1/artifacts/runs/$RUN_ID/export" \
  -H "Authorization: Bearer $TOKEN"
```

Sponsor/procurement exports: `./scripts/collect-first-pilot-proof.ps1 -BaseUrl $BASE -RunId $RUN_ID -SponsorHandoff`

---

## Step 5 — Compare two committed runs

```bash
curl -sS "$BASE/v1/authority/compare/runs?leftRunId=$LEFT&rightRunId=$RIGHT" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Step 6 — ROI summary

Per-run (sponsor-safe estimates only):

```bash
curl -sS "$BASE/v1/architecture/review/$RUN_ID/roi" \
  -H "Authorization: Bearer $TOKEN"
```

Sponsor aggregate (optional; requires sufficient committed runs):

```bash
curl -sS "$BASE/v1/analytics/roi" \
  -H "Authorization: Bearer $TOKEN"
```

**Claim boundary:** ROI figures are estimates — not invoiced Azure OpenAI spend. Sponsor-safe SEND requires baseline completeness per [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy).

---

## Idempotency and safe retries

| Surface | Guidance |
| --- | --- |
| Mutating routes | Send `Idempotency-Key` header on POST mutations where documented in OpenAPI |
| Execute | Safe to retry when run is still in `Created` / failed-executable state; `409` when state disallows |
| Commit | Not idempotent across success — check run status before retry |
| Export | Safe GET retry |

Drift guard: `scripts/ci/detect_mutating_route_idempotency_drift.py`

---

## OpenAPI import notes

1. Download contract: `GET /openapi/v1.json` (canonical) — not Swagger-only JSON.
2. Regenerate UI types: `cd archlucid-ui && npm run generate:api-types`
3. .NET client: `ArchLucid.Api.Client` (repo project reference or NuGet when published).
4. Validate starter paths: `python scripts/ci/check_v1_integration_starter_contracts.py`

---

## SCIM and CI examples (V1)

| Need | Doc |
| --- | --- |
| Identity provisioning | [`integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md) |
| GitHub / Azure DevOps PR decoration | [`integrations/CICD_INTEGRATION.md`](../integrations/CICD_INTEGRATION.md) |
| Azure extractor ZIP ingest | [`AZURE_EXTRACTOR.md`](AZURE_EXTRACTOR.md) |
| Copy-paste REST recipes | [`V1_REST_CLI_INTEGRATION_RECIPES.md`](V1_REST_CLI_INTEGRATION_RECIPES.md) |

---

## What is explicitly out of scope for V1 automation

Do **not** plan V1 go-live that **requires**:

- Jira / ServiceNow incident creation
- Confluence page publish
- Slack / Teams notifications
- CloudEvents / Service Bus fan-out
- MCP agent-tool membrane

These are **V1.1** commitments — see [`V1_DEFERRED.md`](V1_DEFERRED.md) and [`INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md).

---

## Related

- [`OPERATOR_QUICKSTART.md`](customer-facing/OPERATOR_QUICKSTART.md)
- [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)
- [`CLI_USAGE.md`](CLI_USAGE.md)
