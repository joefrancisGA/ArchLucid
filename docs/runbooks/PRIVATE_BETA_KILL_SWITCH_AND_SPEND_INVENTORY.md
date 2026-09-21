> **Scope:** Operator inventory for private-beta cuts — freeze spend, roll back deploy, disable one tenant. Extends [`architecture_handbook/47-kill-switches-circuit-breakers.md`](../architecture/architecture_handbook/47-kill-switches-circuit-breakers.md).

# Private-beta kill-switch and LLM spend inventory

**Goal:** Freeze Real LLM spend in **< 5 minutes**, roll back last API+UI deploy, disable one tenant without touching others.

---

## LLM spend paths

| Path | Cap today | Kill switch | User-visible failure |
| --- | --- | --- | --- |
| Authority execute (Real) | Per-tenant monthly budget + reservation (`LlmMonthlyTenantDollarBudgetTracker`) | Set `AgentExecution:Mode=Simulator` on API/worker; deny Real execute | Budget exceeded / mode badge |
| Quick Scan (public) | Sample-only (**TB-902** YELLOW) | Keep `AnonymousExecutionEnabled=false` | Sample analysis only |
| Golden cohort CI | Budget probe + kill band | `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` repo var | CI job fails closed |
| Ask / explain (operator) | Same tenant budget decorators | Simulator mode + feature flags | Inline error + correlation id |
| Trial AI budget provisioner | Self-service trial caps | Disable trial provisioning flag | Trial blocked |

**P0 if unwired:** Any path that can call AOAI without tenant budget check or without Simulator override documented above.

---

## Freeze Real LLM in under five minutes

1. Set `AgentExecution__Mode=Simulator` on API **and** worker (env / Key Vault / Container Apps revision).
2. Confirm Quick Scan stays sample-only: `AnonymousExecutionEnabled=false`.
3. Optionally set tenant monthly budget to `0` if one named tenant is the spend source.
4. User-visible result: execute/Ask fail closed with mode badge + correlation id — not a silent hang.

Do **not** disable SQL or auth to stop spend; that takes the invite path down with it.

### Verification checklist

Record the UTC time and operator for each action. The freeze is complete only when all
four checks pass:

- API and worker configuration both report `Simulator`; checking only the API is
  insufficient because queued work may execute in the worker.
- `AnonymousExecutionEnabled` remains `false`, and the public Quick Scan response is
  still sample-only.
- A named tenant cannot reserve a Real-model budget after the change; a zero budget
  is a tenant-specific backstop, not a substitute for the global mode switch.
- A controlled execute/Ask request returns the documented mode/correlation response
  within the normal request timeout, rather than hanging or silently succeeding.

If any check fails, keep the invite wave paused and escalate with the `correlationId`,
`runId` (when available), configuration revision, and UTC timestamps.

---

## Email and storage spend

| Path | Cap today | Kill switch | User-visible failure |
| --- | --- | --- | --- |
| Invite / notification email | Admin-only invite API; provider rate limits | Disable email sender config / connection string | Invite send error surfaced to admin |
| Report Problem bundles | Consent-gated; size-capped (**TB-787**) | Feature flag / queue drain | Inline error + correlation id |
| Extractor / evidence blobs | Per-tenant storage quota | Revoke tenant execute + disable upload | Upload rejected |
| Audit CSV / sponsor export | Authenticated operator only | Same as execute kill (Simulator still allows export of existing runs) | Export error if pipeline down |

---

## Capacity note (about 10 named users this week)

What breaks first under a 10-invitee wave, in order:

1. **AOAI TPM** on Real execute (if anyone flips off Simulator) — freeze with `AgentExecution__Mode=Simulator`.
2. **Worker queue depth** on create-run / authority pipeline — visible as stuck runs; use triage card.
3. **SQL DTU / pool** on cold draft-list and invite GETs — already stubbed in JwtBearer CI; production may still run slow first hits.

SQL and queue issues are reliability, not unbounded spend. Unbounded spend is Real LLM + anonymous Quick Scan (keep Quick Scan sample-only).

---

## Deploy rollback

| Layer | Action |
| --- | --- |
| API + worker | Redeploy previous container image/tag from last green RC |
| UI | Redeploy previous Next standalone artifact |
| Feature flags | Revert `appsettings` / Key Vault secret to prior revision |
| Database | Forward-only migrations — rollback is redeploy + compat, not down-migrate |

See [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md) and [`RC_RELEASE_GATE.md`](RC_RELEASE_GATE.md).

---

## Single-tenant offboarding

| Step | Mechanism |
| --- | --- |
| Disable login | Remove/disable user in IdP or SCIM; revoke invites |
| Stop spend | Tenant budget = 0 or block execute for tenant id |
| Export | Sponsor packet / audit CSV per tenant request |
| Delete | Tombstone per data-handling policy |

---

## Abuse / rate limits (beta window)

| Surface | Guard |
| --- | --- |
| Invite API | Admin-only; audit invite attempts |
| Report Problem | Consent-gated bundle (**TB-787**) |
| Public forms | Request-access only — no anonymous execute |

---

## Incident comms

[`INCIDENT_COMMUNICATIONS_POLICY.md`](../go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md) · on-call dashboards: [`INCIDENT_INVESTIGATION.md`](INCIDENT_INVESTIGATION.md)
