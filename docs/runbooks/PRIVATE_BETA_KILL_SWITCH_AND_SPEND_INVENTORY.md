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
