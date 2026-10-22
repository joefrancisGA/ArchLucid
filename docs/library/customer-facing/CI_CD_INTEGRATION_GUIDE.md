> **Scope:** Customer-facing — embed ArchLucid into GitHub Actions and Azure DevOps pipelines using the V1 REST + CLI surfaces.

# CI/CD integration guide (V1)

**Audience:** Platform engineers wiring architecture review into pull-request or release pipelines using the **V1 REST + CLI** surfaces. First-party **Jira**, **ServiceNow**, **Teams**, and **Slack** connectors are **V1 GA** for UI-driven workflows; this guide focuses on pipeline automation that does not require those connectors.

**Canonical automation spine:** [`V1_AUTOMATION_HANDOFF_PACK.md`](../V1_AUTOMATION_HANDOFF_PACK.md) Â· CLI reference: [`CLI_USAGE.md`](../CLI_USAGE.md)

**Copy-paste workflow examples:** [`examples/github-actions/archlucid-architecture-review.yml`](../../../examples/github-actions/archlucid-architecture-review.yml) Â· [`examples/azure-devops/archlucid-architecture-review.yml`](../../../examples/azure-devops/archlucid-architecture-review.yml)

---

## End-to-end flow

The product calls these steps an **architecture review** that you **finalize** into a **sealed review record**. The API and CLI keep the original identifiers — `run`, `runId`, `commit` — permanently, for compatibility. Same objects, two names; this table is the mapping.

| Step (buyer language) | REST (API still uses run/commit) | CLI |
| --- | --- | --- |
| Create architecture review | `POST /v1/architecture/request` | `archlucid run` (optional `--idempotency-key`) |
| Execute | `POST /v1/architecture/review/{runId}/execute` | `archlucid architecture execute <runId>` |
| Poll | `GET /v1/architecture/review/{runId}` | `archlucid status <runId>` |
| Finalize architecture package | `POST /v1/architecture/review/{runId}/finalize` | `archlucid commit <runId>` |
| Export | `GET /v1/artifacts/architecture/reviews/{runId}/export` | `archlucid artifacts export <runId>` |
| Sponsor report | `GET /v1/pilots/architecture/reviews/{runId}/first-value-report` | `archlucid first-value-report <runId>` |

Send **`Idempotency-Key`** on `POST /v1/architecture/request` so safe replays return **`X-Idempotency-Replayed: true`** instead of creating duplicate reviews.

When **`ArchLucid:Governance:PreCommitGateEnabled`** is on and a policy pack blocks on Critical findings, **`POST .../commit`** (finalize) returns **409** with problem type **`#governance-pre-commit-blocked`**. Treat that as a failed pipeline gate.

---

## GitHub Actions (Azure Extractor ZIP + pre-finalize gate)

Store secrets:

- `ARCHLUCID_API_URL` — API base (no trailing slash)
- `ARCHLUCID_API_KEY` — API key with authority to create/execute/finalize reviews (`X-ArchLucid-Api-Key`)

```yaml
name: ArchLucid architecture gate

on:
  pull_request:
    paths:
      - 'infra/**'
      - 'docs/architecture/**'

env:
  ARCHLUCID_API_URL: ${{ secrets.ARCHLUCID_API_URL }}
  ARCHLUCID_API_KEY: ${{ secrets.ARCHLUCID_API_KEY }}

jobs:
  archlucid-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install ArchLucid CLI
        run: |
          dotnet tool install --global ArchLucid.Cli --version 0.0.0 || true
          echo "$HOME/.dotnet/tools" >> "$GITHUB_PATH"

      - name: Create architecture review
        id: create
        run: |
          IDEMPOTENCY_KEY="$(uuidgen)"
          RESPONSE=$(curl -sS -X POST "${ARCHLUCID_API_URL}/v1/architecture/request" \
            -H "Content-Type: application/json" \
            -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
            -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
            -H "X-Correlation-ID: gh-${{ github.run_id }}" \
            -d '{
              "requestId": "'"${IDEMPOTENCY_KEY}"'",
              "systemName": "pr-${{ github.event.pull_request.number }}",
              "environment": "ci",
              "cloudProvider": "Azure",
              "description": "PR #${{ github.event.pull_request.number }} architecture gate",
              "constraints": [],
              "requiredCapabilities": [],
              "assumptions": []
            }')
          RUN_ID=$(echo "$RESPONSE" | jq -r '.run.runId // .runId')
          echo "run_id=${RUN_ID}" >> "$GITHUB_OUTPUT"

      - name: Upload Azure Extractor ZIP (optional)
        if: hashFiles('artifacts/azure-extractor.zip') != ''
        run: |
          curl -sS -X POST "${ARCHLUCID_API_URL}/v1/azure/extractor/packages" \
            -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
            -H "X-Correlation-ID: gh-extract-${{ github.run_id }}" \
            -F "runId=${{ steps.create.outputs.run_id }}" \
            -F "package=@artifacts/azure-extractor.zip"

      - name: Execute review
        run: |
          curl -sS -X POST "${ARCHLUCID_API_URL}/v1/architecture/review/${{ steps.create.outputs.run_id }}/execute" \
            -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
            -H "X-Correlation-ID: gh-exec-${{ github.run_id }}"

      - name: Poll until ready for commit
        run: |
          RUN_ID="${{ steps.create.outputs.run_id }}"
          for i in $(seq 1 60); do
            STATUS=$(curl -sS "${ARCHLUCID_API_URL}/v1/architecture/review/${RUN_ID}" \
              -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" | jq -r '.status')
            echo "status=${STATUS} attempt=${i}"
            if [ "$STATUS" = "ReadyForCommit" ] || [ "$STATUS" = "Committed" ]; then
              exit 0
            fi
            sleep 10
          done
          echo "Timed out waiting for run ${RUN_ID}"
          exit 1

      - name: Commit and fail on governance pre-commit block (409)
        run: |
          HTTP_CODE=$(curl -sS -o commit-body.json -w "%{http_code}" \
            -X POST "${ARCHLUCID_API_URL}/v1/architecture/review/${{ steps.create.outputs.run_id }}/commit" \
            -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
            -H "X-Correlation-ID: gh-commit-${{ github.run_id }}")
          if [ "$HTTP_CODE" = "409" ]; then
            echo "Pre-finalize governance gate blocked finalize (API: pre-commit):"
            cat commit-body.json
            exit 1
          fi
          if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
            cat commit-body.json
            exit 1
          fi

      - name: Fetch first-value report (artifact)
        if: success()
        run: |
          curl -sS "${ARCHLUCID_API_URL}/v1/pilots/architecture/reviews/${{ steps.create.outputs.run_id }}/first-value-report" \
            -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
            -H "Accept: text/markdown" \
            -o first-value-report.md
```

---

## Azure DevOps equivalent

Use the same REST sequence in a `bash` step. Set secret variables `ArchLucidApiUrl` and `ArchLucidApiKey`, then map:

```yaml
variables:
  ARCHLUCID_API_URL: $(ArchLucidApiUrl)
  ARCHLUCID_API_KEY: $(ArchLucidApiKey)

steps:
  - bash: |
      set -euo pipefail
      IDEMPOTENCY_KEY="$(uuidgen)"
      RESPONSE=$(curl -sS -X POST "${ARCHLUCID_API_URL}/v1/architecture/request" \
        -H "Content-Type: application/json" \
        -H "X-ArchLucid-Api-Key: ${ARCHLUCID_API_KEY}" \
        -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
        -d '{"requestId":"'"${IDEMPOTENCY_KEY}"'","systemName":"ado-gate","environment":"ci","cloudProvider":"Azure","description":"ADO pipeline gate","constraints":[],"requiredCapabilities":[],"assumptions":[]}')
      echo "##vso[task.setvariable variable=RunId]$(echo "$RESPONSE" | jq -r '.run.runId // .runId')"
    displayName: Create ArchLucid review
```

Poll, execute, and commit using the same URLs as the GitHub Actions sample. Publish `first-value-report.md` with `PublishBuildArtifacts@1`.

---

## Safe retries

| Surface | Guidance |
| --- | --- |
| `POST /v1/architecture/request` | Always send `Idempotency-Key`; **do not** auto-retry on gateway timeout without checking whether the review was created |
| `POST .../execute` | Retry only while the review is still executable; expect **409** when state disallows |
| `POST .../commit` (finalize) | **Not** idempotent after success — poll review status before retry |
| Export / report GETs | Safe to retry |

The architect workspace uses the same idempotency semantics; on **504/408** it surfaces: *"Request timed out. Please check Reviews before resubmitting to avoid duplicates."*

---

## Related

- [Integration readiness](/help/integration-readiness) — optional connectors after first architecture package
- [`docs/integrations/CICD_INTEGRATION.md`](../../integrations/CICD_INTEGRATION.md) — PR comment pattern and severity thresholds
- [`AZURE_EXTRACTOR.md`](../AZURE_EXTRACTOR.md) — generating the ingest ZIP
- [`PRE_COMMIT_GOVERNANCE_GATE.md`](../PRE_COMMIT_GOVERNANCE_GATE.md) — 409 finalize-gate semantics
