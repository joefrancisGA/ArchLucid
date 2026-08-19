> **Scope:** Symptom-driven decision tree for first-pilot operators — quick matrix plus escalation artifacts; links to deep references without duplicating full runbooks. Absorbs the former Pilot rescue playbook body.

> **Do not start here for the checklist.** Use [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) first; return here when a step fails.

# First-pilot troubleshooting decision tree

**Audience:** Operators and pilot evaluators stuck during Core Pilot — not incident response, security coordination, or a full RCA guide.

**Canonical pilot path:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · **Full detail:** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) · **Narrative:** [`CORE_PILOT.md`](../CORE_PILOT.md)

Capture **`X-Correlation-ID`** (or `correlationId` in problem JSON) on every failed API call before escalating.

**Escalation contacts:** [`PILOT_GUIDE.md`](../library/customer-facing/PILOT_GUIDE.md).

**Unsafe shortcuts:** Do **not** enable **`DevelopmentBypass`** or **RLS bypass** outside documented break-glass — [`COMMON_ERRORS.md`](COMMON_ERRORS.md) (DevelopmentBypass and tenant/RLS mismatch sections).

---

## Quick matrix (symptom → first check)

Use this when you need a one-screen index. Numbered sections below add escalation artifacts.

| Symptom | Likely cause | First command / check | Next doc |
| --- | --- | --- | --- |
| API unreachable / connection refused | Host down, wrong URL/port, network, TLS | `dotnet run --project ArchLucid.Cli -- doctor`; confirm `ARCHLUCID_API_URL` / TLS | [`COMMON_ERRORS.md`](COMMON_ERRORS.md), [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |
| **`/health/ready`** unhealthy | Missing dependency (SQL, Bus, Key Vault), migration, config | Read JSON `entries[]` for first **Unhealthy** / **Degraded** (dependency name) | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (opening readiness steps) |
| SQL migration / DbUp at startup | Bad connection string, permissions, pending migration conflict | Read first `InvalidOperationException` / DbUp line in API console | [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) |
| **401** | Missing/invalid API key or JWT | Set `ARCHLUCID_API_KEY` or Entra bearer per environment docs | [`API_KEY_ROTATION.md`](API_KEY_ROTATION.md), [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md) |
| **403** | Role or scope (tenant/workspace/project) mismatch | Confirm identity, **`x-tenant-id`**, workspace/project headers | [`OPERATOR_ATLAS.md`](../library/OPERATOR_ATLAS.md) |
| **402** | Trial / seat entitlement exhausted | Read response `detail` and `supportHint` — no entitlement bypass in production | [`TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md) |
| Azure extractor upload **422** | Wrong scope, corrupt ZIP, missing payloads | Validate ZIP contains `manifest.json`; re-run Tier 1 script | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| Run not **Ready to finalize** / pipeline stuck | Prior stage incomplete, execute failure, worker down, AOAI circuit | Review detail pipeline timeline; `archlucid status <runId>` | [`CORE_PILOT.md`](../CORE_PILOT.md) (steps 2–3), [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md) |
| Finalize / **commit** blocked (governance) | Policy gate requires fixes or documented override | Capture gate message + findings snapshot id | [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) |
| No artifacts after finalize | Commit not 2xx, async worker lag, wrong run scope | Re-check finalize response; refresh review; search logs by correlation id | [`CORE_PILOT.md`](../CORE_PILOT.md) (step 4), [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Real-mode / **Azure OpenAI** failures | Quota, deployment name, circuit breaker, auth to AOAI | **`GET /health`** → `circuit_breakers`; verify deployment settings (non-secret names only) | [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md), [`RESILIENCE_CONFIGURATION.md`](../library/RESILIENCE_CONFIGURATION.md), [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) |
| Low-confidence / disputed finding | PilotStrict rejection, degraded agent, weak grounding | Finding inspect → confidence source; evidence chain for trace ids | [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md), [`AGENT_TRACE_FORENSICS.md`](../library/AGENT_TRACE_FORENSICS.md) |
| Support ZIP before external send | Residual secrets or unintended tenant/contact data | Open `README.txt` → `next-steps.json` → `references.json`; manually review before send | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (support bundle) |

---

## 1. API not ready / connection refused

| Step | Action |
|------|--------|
| First check | `dotnet run --project ArchLucid.Cli -- doctor` (API must be listening) |
| Likely cause | Wrong base URL, host down, TLS mismatch, SQL not reachable |
| Escalation artifact | `doctor` output + `GET /version` JSON |

→ [`COMMON_ERRORS.md`](COMMON_ERRORS.md) · [`DEPLOYMENT_RUNBOOK.md`](../library/DEPLOYMENT_RUNBOOK.md)

---

## 2. `/health/ready` unhealthy

| Step | Action |
|------|--------|
| First check | Read JSON `entries[]` for first **Unhealthy** / **Degraded** dependency name |
| Likely cause | Missing dependency (SQL, Bus, Key Vault), migration, config |
| Escalation artifact | Ready payload excerpt (no secrets) + `doctor` output |

→ [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (opening readiness steps)

---

## 3. SQL migration failure / DbUp errors at startup

| Step | Action |
|------|--------|
| First check | Read first `InvalidOperationException` / DbUp line in API console |
| Likely cause | Bad connection string, permissions, pending migration conflict |
| Escalation artifact | Migration log excerpt (no passwords) |

→ [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) · [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (API startup)

---

## 4. Auth **401** / **403**

| Step | Action |
|------|--------|
| First check | Confirm `ArchLucidAuth:Mode`, API key or JWT, and scope headers (`x-tenant-id`, workspace, project) |
| Likely cause | Missing role mapping, wrong audience, dev bypass in shared env, scope mismatch |
| Escalation artifact | `archlucid auth diagnostics` or `GET /v1/admin/auth/configuration-diagnostics` (admin key; no secrets in output) |

→ [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md) · [`API_KEY_ROTATION.md`](API_KEY_ROTATION.md) · Settings → **Identity providers** (OIDC discovery strip) · [`OPERATOR_ATLAS.md`](../library/OPERATOR_ATLAS.md) (403 scope)

---

## 5. Trial **402** (entitlement)

| Step | Action |
|------|--------|
| First check | Read response `detail` and `supportHint` |
| Likely cause | Trial seat or LLM budget exhausted |
| Escalation artifact | Problem JSON + tenant id (internal ticket only) |

→ [`TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md)

---

## 6. Azure extractor upload **422**

| Step | Action |
|------|--------|
| First check | Validate ZIP contains `manifest.json`; re-run Tier 1 script in customer subscription |
| Likely cause | Wrong scope, corrupt ZIP, missing required payloads |
| Escalation artifact | Extractor `manifest.json` header (redact subscription ids if needed) |

→ [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md)

---

## 7. Execute stalls / review not **Ready to finalize**

| Step | Action |
|------|--------|
| First check | Review detail pipeline timeline + `ReviewId=` in logs; optional `archlucid status <runId>` |
| Likely cause | Worker not running, AOAI circuit open, prior stage failure |
| Escalation artifact | Correlation id + `support-bundle --zip` |

→ [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md) · [`CORE_PILOT.md`](../CORE_PILOT.md) (steps 2–3)

---

## 8. Real-mode / Azure OpenAI failures

| Step | Action |
|------|--------|
| First check | **`GET /health`** → `circuit_breakers`; verify deployment / endpoint config names only (no secrets in notes) |
| Likely cause | Quota, wrong deployment name, circuit breaker open, auth to AOAI |
| Escalation artifact | Health circuit excerpt + correlation id (no prompt bodies) |

→ [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md) · [`RESILIENCE_CONFIGURATION.md`](../library/RESILIENCE_CONFIGURATION.md) · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)

---

## 9. Finalize **409** / governance pre-finalize gate blocked

| Step | Action |
|------|--------|
| First check | Gate message on review detail; note findings snapshot id |
| Likely cause | Blocking policy pack findings, idempotent replay |
| Escalation artifact | Gate JSON + top blocking finding ids |

→ [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md)

---

## 10. Missing artifact bundle after finalize

| Step | Action |
|------|--------|
| First check | Confirm finalize returned 2xx; refresh review detail artifacts table |
| Likely cause | Async synthesis lag, wrong scope, empty synthesis |
| Escalation artifact | Finalize response body + sealed review record id |

→ [`CORE_PILOT.md`](../CORE_PILOT.md) (step 4) · [`API_CONTRACTS.md`](../library/API_CONTRACTS.md)

---

## 11. Low-confidence AI output / disputed finding

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

Or `archlucid support-bundle --zip` when the tool is installed.

Open **`README.txt`**, then **`next-steps.json`**; use **`references.json`** for doc paths from repo root.

Shipped bundles redact bearer tokens / API keys / password-shaped lines automatically. **Resolved 2026-05-03** — [item 37(c)](../PENDING_QUESTIONS.md): manually review **before external send**; include tenant-identifying or contact **PII** only when the downloader holds **ExecuteAuthority** and **explicitly intends** disclosure.

See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) (support bundle / redaction checklist).
