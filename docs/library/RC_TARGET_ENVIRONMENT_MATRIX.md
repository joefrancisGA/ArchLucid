> **Scope:** Contributor-reference — release-owner matrix for which environment class is authoritative for RC and sponsor proof evidence.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# RC target environment matrix (V1)

**Owner decision (2026-06-07):** **Staging** is **contract-authoritative** for release evidence that depends on a live API (RC drill, health/version probes, deployment-evidence, doctor, support-bundle, sponsor proof environment attachment).

Machine-readable source: [`scripts/ci/data/rc_target_environment_matrix.v1.json`](../../scripts/ci/data/rc_target_environment_matrix.v1.json).

## Environment roles

| Environment | Role | Authoritative for RC signoff? |
| --- | --- | :---: |
| **Staging** | Pre-production hosted fleet used for RC validation | **Yes** |
| **Production-like (repo-local)** | Config lint, offline release bundle, Terraform drift on repo host | No — supplementary config/IaC evidence only |
| **Production** | Post-RC promotion target | No — not primary RC evidence unless owner documents override |

## What to run against Staging

1. `scripts/v1-rc-drill.ps1 -ApiBaseUrl https://<staging-host> -BearerToken $env:ARCHLUCID_BEARER_TOKEN` (default staging auth mode; ApiKey override when required)
2. `scripts/capture-staging-readiness-evidence.ps1 -BaseUrl https://<staging-host> -BearerToken $env:ARCHLUCID_BEARER_TOKEN [-RunRcDrill]` (`-AuthMode` defaults to **Bearer**)
3. `scripts/Emit-ReleaseReadinessEvidence.ps1 -StrictRc -ApiBaseUrl https://<staging-host>` (live rows in release-readiness bundle)
4. Attach staging capture + RC drill result (`artifacts/v1-rc-drill-result.json`) to release artifacts.

## What stays repo-local (not a Staging substitute)

- `Emit-ReleaseReadinessEvidence.ps1` without `-ApiBaseUrl` still emits offline config/IaC/claim gates; `-Environment Production` labels **appsettings** reports, not the authoritative live target.
- `production-like-hosted-pilot` config lint profile validates hosted posture from committed config — required, but distinct from Staging live probes.

## Auth mode

**Default for Staging:** **Bearer** JWT (`Authorization: Bearer …`). Supply via `-BearerToken` on RC scripts or `ARCHLUCID_BEARER_TOKEN` in the operator environment.

Record the auth mode used in run notes and in `capture-staging-readiness-evidence.ps1` output (`-AuthMode`, default **Bearer**). Overrides: `ApiKey` when the deployment requires it; `DevelopmentBypass` for local lab only (not Staging contract evidence).

## Base URL

Staging base URLs are **environment-specific** and must not be committed. Resolve from your GitHub **staging** environment, Azure Container Apps FQDN, or internal runbook.

## Sponsor proof

Sponsor-facing proof packets should cite **Staging** as the live evidence environment unless the release owner approves a documented exception.

## Related

- [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md)
- [`V1_RC_DRILL.md`](V1_RC_DRILL.md)
- [`RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`](../quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md)
