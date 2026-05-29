> **Scope:** Contributor-reference — copyable V1 REST/CLI handoff recipes — no V1.1 first-party connectors.

# V1 REST/CLI integration recipes

**Auth:** Entra ID / OIDC bearer for operators; API keys for automation. Capture **`X-Correlation-ID`** on failures.

**Deferred:** Jira, ServiceNow, Confluence, Slack connectors (V1.1) — see [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md).

## 1. Create review from CI

```bash
archlucid run create --json --system-name "CI review" --description "from pipeline"
```

Poll: `GET /v1/architecture/run/{runId}` until status progresses past Created.

## 2. Upload evidence and execute

```bash
# Upload extractor ZIP (tenant-scoped auth required)
curl -sS -X POST "$BASE/v1/azure-extractor/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@package.zip" -F "runId=$RUN_ID"

curl -sS -X POST "$BASE/v1/architecture/run/$RUN_ID/execute" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Commit manifest

```bash
curl -sS -X POST "$BASE/v1/architecture/run/$RUN_ID/commit" \
  -H "Authorization: Bearer $TOKEN"
```

Success: `CurrentManifestVersion` set; artifacts table non-empty on run detail.

## 4. Download sponsor artifacts

- UI: review detail → sponsor exports
- API: first-value report endpoints per [`API_CONTRACTS.md`](API_CONTRACTS.md)
- Proof folder: `./scripts/collect-first-pilot-proof.ps1 -BaseUrl $BASE -RunId $RUN_ID -SponsorHandoff`

## 5. Post link back to GitHub or Azure DevOps

No V1.1 connector required — paste generated comment:

- `v1-workflow-handoff-comment.md` from proof folder
- Recipe: [`../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md)

## 6. Export procurement-safe evidence

```bash
python scripts/build_procurement_pack.py --strict
```

Read `procurement-pack-quality.md` before send. Request guide: [`../go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`](../go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md).

## 7. Error handling examples

```bash
# 401 — missing or wrong bearer
curl -sS -o /dev/null -w "%{http_code}" "$BASE/v1/architecture/run/$RUN_ID"
# Expect 401: refresh token; verify ArchLucidAuth:Mode and tenant scope.

# Execute blocked (409/422) — quality gate
curl -sS -X POST "$BASE/v1/architecture/run/$RUN_ID/execute" -H "Authorization: Bearer $TOKEN"
# Follow ../runbooks/QUALITY_GATE_REJECTION.md; rerun after PilotStrict evidence is satisfied.
```

## Failure behavior

| Failure | Next action |
| --- | --- |
| 401/403 | Fix auth mode and roles — [`../runbooks/FIRST_PILOT_TROUBLESHOOTING.md`](../runbooks/FIRST_PILOT_TROUBLESHOOTING.md) |
| Execute blocked by quality gate | [`../runbooks/QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md) |
| Proof HOLD | Open `first-pilot-command-center.md` **NEXT ACTION** row |
| Sponsor handoff BLOCK on missing retrieval IR | `python scripts/ci/eval_retrieval_ir.py --enforce` then re-run proof with `-SponsorHandoff` |

## Related

- [`CLI_USAGE.md`](CLI_USAGE.md)
- [`API_CONTRACTS.md`](API_CONTRACTS.md)
