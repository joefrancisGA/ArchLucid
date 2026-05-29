> **Scope:** Symptom-driven decision tree for first-pilot operators — links to deep references without duplicating full runbooks.

> **Do not start here for the checklist.** Use [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) first; return here when a step fails.

# First-pilot troubleshooting decision tree

**Canonical pilot path:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · **Stuck mid-pilot index:** [`PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) · **Full detail:** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

Capture **`X-Correlation-ID`** (or `correlationId` in problem JSON) on every failed API call before escalating.

---

## 1. API not ready / connection refused

| Step | Action |
|------|--------|
| First check | `dotnet run --project ArchLucid.Cli -- doctor` (API must be listening) |
| Likely cause | Wrong base URL, host down, TLS mismatch, SQL not reachable |
| Escalation artifact | `doctor` output + `GET /version` JSON |

→ [`COMMON_ERRORS.md`](COMMON_ERRORS.md) · [`DEPLOYMENT_RUNBOOK.md`](../library/DEPLOYMENT_RUNBOOK.md)

---

## 2. SQL migration failure / DbUp errors at startup

| Step | Action |
|------|--------|
| First check | Read first `InvalidOperationException` / DbUp line in API console |
| Likely cause | Bad connection string, permissions, pending migration conflict |
| Escalation artifact | Migration log excerpt (no passwords) |

→ [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) · [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (API startup)

---

## 3. Auth **401** / **403**

| Step | Action |
|------|--------|
| First check | Confirm `ArchLucidAuth:Mode`, API key or JWT, and scope headers (`x-tenant-id`, workspace, project) |
| Likely cause | Missing role mapping, wrong audience, dev bypass in shared env, scope mismatch |
| Escalation artifact | `archlucid auth diagnostics` or `GET /v1/admin/auth/configuration-diagnostics` (admin key; no secrets in output) |

→ [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md) · [`API_KEY_ROTATION.md`](../library/API_KEY_ROTATION.md) · Settings → **Identity providers** (OIDC discovery strip)

---

## 4. Trial **402** (entitlement)

| Step | Action |
|------|--------|
| First check | Read response `detail` and `supportHint` |
| Likely cause | Trial seat or LLM budget exhausted |
| Escalation artifact | Problem JSON + tenant id (internal ticket only) |

→ [`TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md)

---

## 5. Azure extractor upload **422**

| Step | Action |
|------|--------|
| First check | Validate ZIP contains `manifest.json`; re-run Tier 1 script in customer subscription |
| Likely cause | Wrong scope, corrupt ZIP, missing required payloads |
| Escalation artifact | Extractor `manifest.json` header (redact subscription ids if needed) |

→ [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md)

---

## 6. Execute stalls / run not **Ready for commit**

| Step | Action |
|------|--------|
| First check | Review detail pipeline timeline + `RunId=` in logs |
| Likely cause | Worker not running, AOAI circuit open, prior stage failure |
| Escalation artifact | Correlation id + `support-bundle --zip` |

→ [`PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) · [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md)

---

## 7. Commit **409** / governance pre-commit blocked

| Step | Action |
|------|--------|
| First check | Gate message on review detail; note findings snapshot id |
| Likely cause | Blocking policy pack findings, idempotent replay |
| Escalation artifact | Gate JSON + top blocking finding ids |

→ [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md)

---

## 8. Missing artifact bundle after commit

| Step | Action |
|------|--------|
| First check | Confirm commit returned 2xx; refresh review detail artifacts table |
| Likely cause | Async synthesis lag, wrong scope, empty synthesis |
| Escalation artifact | Commit response body + manifest id |

→ [`CORE_PILOT.md`](../CORE_PILOT.md) (step 4)

---

## 9. Low-confidence AI output / disputed finding

| Step | Action |
|------|--------|
| First check | Finding inspect → confidence source; `GET` finding evidence chain for trace ids |
| Likely cause | PilotStrict rejection path, degraded agent, weak retrieval grounding |
| Escalation artifact | Finding id, snapshot id, forensic index (no prompt bodies) |

→ [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) · [`AGENT_TRACE_FORENSICS.md`](../library/AGENT_TRACE_FORENSICS.md)

---

## Support bundle (any symptom)

```bash
dotnet run --project ArchLucid.Cli -- support-bundle --zip
```

Review **`README.txt`** and **`next-steps.json`** before external send — see [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (support bundle checklist).
