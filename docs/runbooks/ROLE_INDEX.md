> **Scope:** Persona entry map — sequences existing runbooks and scripts; does not duplicate procedures.

# Role index — first pilot and release

**Audience:** Pick **one** row below. This file maps personas to canonical sources in execution order. Technical steps live only in linked docs and scripts.

**Last reviewed:** 2026-06-06

---

## Pick your role

| Persona | You are… | Open these first (3–4 docs max) | Canonical procedure |
|---------|----------|----------------------------------|---------------------|
| **Operator** | Running the first architecture review for a buyer or design partner | 1. This index (you are here) → 2. [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) → 3. [`CORE_PILOT.md`](../CORE_PILOT.md) (four-step narrative) → 4. [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) after first commit | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) |
| **Platform engineer** | Standing up SQL, auth, hosting, and production-like config before operators start | 1. This index → 2. [`PILOT_PREREQUISITES.md`](PILOT_PREREQUISITES.md) → 3. [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) → 4. [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) | [`PILOT_PREREQUISITES.md`](PILOT_PREREQUISITES.md) + [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) |
| **Release owner** | Cutting a V1 build, RC, or pilot-environment signoff | 1. This index → 2. [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) → 3. [`RELEASE_LOCAL.md`](../library/RELEASE_LOCAL.md) → 4. [`RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md) | [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) |

## V1 critical path (mandatory docs)

| Role | Mandatory documents |
| --- | --- |
| Buyer / sponsor sponsor | [`CORE_PILOT.md`](../CORE_PILOT.md) · [`BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) · [`trust-center.md`](../go-to-market/trust-center.md) for security threads · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) after finalize |
| Operator / pilot lead | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) for hosted pilots · [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../library/RC_TARGET_ENVIRONMENT_MATRIX.md) and [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) for RC evidence |
| Security reviewer | [`trust-center.md`](../go-to-market/trust-center.md) · [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) · [`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) · [`SECURITY.md`](../library/contributor-reference/SECURITY.md) |
| Integrator / automation | [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) · [`LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) · [`CLI_USAGE.md`](../library/CLI_USAGE.md) when needed |
| Release owner | `Invoke-FirstPilotStrictPath.ps1` · `Emit-ReleaseReadinessEvidence.ps1 -StrictRc` · `rc-go-no-go-verdict.json` · [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) |

**Depth only (not initial path):** [`BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) · [`architecture/README.md`](../architecture/README.md) · [`START_HERE.md`](../START_HERE.md) (full repo hub).

---

## Operator — execution order

Use when a committed architecture review and sponsor handoff are the goal.

| Order | When | Go to | Script / command (if any) |
|-------|------|-------|---------------------------|
| 1 | Platform is not READY yet | Hand off to **Platform engineer** section below; return when `GET /health/ready` is green | `.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile FirstPilotMinimum` |
| 2 | First session checklist | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) Phases A–D | `dotnet run --project ArchLucid.Cli -- --json pilot preflight` |
| 3 | Narrative context (optional, short) | [`CORE_PILOT.md`](../CORE_PILOT.md) | — |
| 4 | Readiness-only go/no-go (no committed run yet) | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) Phase A0b | `.\scripts\collect-first-pilot-proof.ps1` |
| 5 | Post-commit evidence folder | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) | `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId>` |
| 6 | Buyer-ready sponsor packet | [`SPONSOR_PACKET.md`](SPONSOR_PACKET.md) | `archlucid sponsor-packet <runId> --out artifacts/sponsor-packet/<runId>` |

**If this failed, go here**

| Symptom | Next doc / action |
|---------|-------------------|
| Auth loop, 401/403 on architect workspace | [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) § auth · `archlucid auth diagnostics` |
| Stuck mid-pilot (symptom-first) | [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) |
| SQL / migration / health not ready | [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) · platform engineer preflight |
| Sponsor handoff HOLD or proof gaps | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) · re-run proof collector |
| Agent execute fails | [`AGENT_EXECUTION_FAILURES.md`](AGENT_EXECUTION_FAILURES.md) |

---

## Platform engineer — execution order

Use before operators open Phase B of the operator path.

| Order | When | Go to | Script / command (if any) |
|-------|------|-------|---------------------------|
| 1 | Greenfield or new subscription | [`FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md) or [`DEPLOYMENT.md`](../engineering/DEPLOYMENT.md) | Terraform roots under `infra/` per [`DEPLOYMENT_TERRAFORM.md`](../library/DEPLOYMENT_TERRAFORM.md) |
| 2 | Blockers before any pilot work | [`PILOT_PREREQUISITES.md`](PILOT_PREREQUISITES.md) | `.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile ProductionLike` |
| 3 | Production-like hosted handoff | [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) | `archlucid config lint --profile production-like-hosted-pilot` |
| 4 | Keys, connection strings, auth mode | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) | — |
| 5 | Migrations and rollback posture | [`MIGRATION_ROLLBACK.md`](MIGRATION_ROLLBACK.md) | DbUp on deploy |
| 6 | Hand off to operator | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) Phase A | — |

**If this failed, go here**

| Symptom | Next doc / action |
|---------|-------------------|
| Config lint BLOCK rows | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) · `artifacts/release-readiness/config-lint-production-like-hosted-pilot.md` |
| Terraform / APIM / private endpoint issues | [`INFRASTRUCTURE_OPS.md`](INFRASTRUCTURE_OPS.md) |
| SQL HA / failover questions | [`DATABASE_FAILOVER.md`](DATABASE_FAILOVER.md) · [`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md) |
| Secret or cert rotation | [`SECRET_AND_CERT_ROTATION.md`](SECRET_AND_CERT_ROTATION.md) |
| Health ready degraded | [`BUILD.md`](../engineering/BUILD.md) health model · [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) |

---

## Release owner — execution order

Use when declaring a V1 release candidate or pilot-environment signoff — not for day-one operator motion.

| Order | When | Go to | Script / command (if any) |
|-------|------|-------|---------------------------|
| 1 | Scope and supported surface | [`V1_SCOPE.md`](../library/V1_SCOPE.md) | — |
| 2 | Full release checklist | [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) | — |
| 3 | Local RC build and readiness gate | [`RELEASE_LOCAL.md`](../library/RELEASE_LOCAL.md) | `.\scripts\run-readiness-check.ps1` |
| 4 | E2E smoke (SQL when in scope) | [`RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md) | `.\scripts\release-smoke.ps1` |
| 5 | Claim / evidence discipline | [`CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](../quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md) | `.\scripts\ci\Invoke-ClaimEvidenceConsistencyGate.ps1` |
| 6 | Staged API drill (optional) | [`V1_RC_DRILL.md`](../library/V1_RC_DRILL.md) | `.\scripts\v1-rc-drill.ps1` |
| 7 | Repeatable rehearsal pack | [`PRODUCTION_READINESS_DRILL.md`](PRODUCTION_READINESS_DRILL.md) | `.\scripts\production-readiness-drill.ps1` |
| 8 | Emit consolidated evidence | [`RELEASE_LOCAL.md`](../library/RELEASE_LOCAL.md) § evidence · [`RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`](../quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md) | `.\scripts\Emit-ReleaseReadinessEvidence.ps1` |
| 8b | Validate evidence bundle minimum | [`RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`](../quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md) | `.\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 -BundleDir artifacts/release-readiness -Profile release-readiness` |

**If this failed, go here**

| Symptom | Next doc / action |
|---------|-------------------|
| Readiness or smoke red | [`RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md) triage § · [`TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md) |
| Config lint blocking RC | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) · `Invoke-ConfigLintProofStep.ps1` artifacts |
| Claim/evidence gate failure | [`CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](../quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md) |
| Real-mode / golden cohort gate | [`GOLDEN_COHORT_REAL_LLM_GATE.md`](GOLDEN_COHORT_REAL_LLM_GATE.md) |
| Migration failure on upgrade | [`MIGRATION_ROLLBACK.md`](MIGRATION_ROLLBACK.md) |

---

## Related indexes

- **Full runbook catalog:** [`README.md`](README.md)
- **Repo hub (all personas):** [`START_HERE.md`](../START_HERE.md)
- **SRE week one (platform depth):** [`onboarding/day-one-sre.md`](../onboarding/day-one-sre.md)
