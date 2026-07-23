> **Scope:** V1 minimum doc path for buyer evaluators, operators, and security reviewers — excludes deferred v1.1/v2 distractions.
> **Spine:** [`START_HERE.md`](../START_HERE.md). **Do not duplicate policy** — follow links only.

# V1 critical path map

**Last reviewed:** 2026-06-07

One-page routing for **successful first pilot** and **RC signoff**. Everything not listed here is optional depth or explicitly deferred per [`V1_DEFERRED.md`](V1_DEFERRED.md).

---

## Choose your role

```text
                    V1_CRITICAL_PATH_MAP.md (you are here)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
    Buyer / sponsor      Operator / SE        Security reviewer
    (evaluate value)     (run pilot)          (assess controls)
         │                    │                    │
         ▼                    ▼                    ▼
   BUYER PATH            OPERATOR PATH         SECURITY PATH
   (below)               (below)               (below)
```

---

## Buyer / executive sponsor path

| Priority | Doc | Mandatory? |
| --- | --- | ---: |
| 1 | [`CORE_PILOT.md`](../CORE_PILOT.md) — four-step narrative | **Yes** |
| 2 | [`go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) | **Yes** |
| 3 | [`go-to-market/trust-center.md`](../go-to-market/trust-center.md) | **Yes** for security threads |
| 4 | [`runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) — after first commit | **Yes** for proof handoff |
| 5 | [`go-to-market/templates/evidence-packet-buyer.template.md`](../go-to-market/templates/evidence-packet-buyer.template.md) | **Yes** for SEND/HOLD framing |

**Skip for V1 headline path:** MCP connectors, Marketplace checkout, multi-cloud depth — see [`V1_DEFERRED.md`](V1_DEFERRED.md).

---

## Operator / pilot lead path

| Priority | Doc / action | Mandatory? |
| --- | --- | ---: |
| 1 | [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) | **Yes** |
| 2 | [`runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](../runbooks/FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) | **Yes** for hosted/sponsor pilots |
| 3 | [`library/RC_TARGET_ENVIRONMENT_MATRIX.md`](RC_TARGET_ENVIRONMENT_MATRIX.md) — Staging + Bearer default | **Yes** for RC evidence |
| 4 | `capture-staging-readiness-evidence.ps1` + `v1-rc-drill.ps1` against Staging | **Yes** for RC signoff |
| 5 | [`library/V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) | **Yes** at release boundary |
| 6 | [`go-to-market/templates/evidence-packet-operator.template.md`](../go-to-market/templates/evidence-packet-operator.template.md) | **Yes** for artifact checklist |

**One-command strict path:** [`Invoke-FirstPilotStrictPath.ps1`](../../scripts/Invoke-FirstPilotStrictPath.ps1) — hybrid mode; set `ARCHLUCID_API_BASE_URL` for Staging live evidence.

---

## Security reviewer path

| Priority | Doc | Mandatory? |
| --- | --- | ---: |
| 1 | [`go-to-market/trust-center.md`](../go-to-market/trust-center.md) | **Yes** |
| 2 | [`security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) | **Yes** |
| 3 | [`security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) | **Yes** |
| 4 | [`library/contributor-reference/SECURITY.md`](contributor-reference/SECURITY.md) | **Yes** |
| 5 | [`security/templates/evidence-packet-security-reviewer.template.md`](../security/templates/evidence-packet-security-reviewer.template.md) | **Yes** for packet assembly |

**Deferred (B-only, not V1 blockers):** CPA SOC 2 report, published third-party pen test — labeled in Trust Center and procurement docs.

---

## Integrator / automation path

| Priority | Doc | Mandatory? |
| --- | --- | ---: |
| 1 | [`library/API_CONTRACTS.md`](API_CONTRACTS.md) + `GET /openapi/v1.json` | **Yes** |
| 2 | [`library/LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md) | **Yes** |
| 3 | [`scripts/ci/data/v1_integration_starter_contracts.v1.json`](../../scripts/ci/data/v1_integration_starter_contracts.v1.json) | **Yes** for fixture-backed workflows |
| 4 | [`library/CLI_USAGE.md`](CLI_USAGE.md) | Optional |

---

## Release owner RC signoff path

| Step | Command / artifact |
| --- | --- |
| 1 | `Invoke-FirstPilotStrictPath.ps1` with Staging URL → `evidenceScope=local-plus-staging-live` |
| 2 | `Emit-ReleaseReadinessEvidence.ps1 -StrictRc -ApiBaseUrl …` |
| 3 | Verify `rc-go-no-go-verdict.json` verdict **PASS** |
| 4 | Attach `deploy-handoff.json` + staging capture to release artifacts |
| 5 | Complete [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) |

---

## Related

- [`V1_SCOPE.md`](V1_SCOPE.md) — scope contract
- [`V1_DEFERRED.md`](V1_DEFERRED.md) — explicit non-goals
- [`runbooks/ROLE_INDEX.md`](../runbooks/ROLE_INDEX.md) — extended role sequences
