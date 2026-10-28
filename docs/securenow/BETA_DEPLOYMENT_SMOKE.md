# SecureNow beta deployment smoke — scoped release gate

The [SecureNow beta deployment smoke workflow](../../.github/workflows/securenow-beta-deployment-smoke.yml) performs **offline** preflight checks for SecureNow only. It does **not deploy**, apply Terraform, change Azure roles, or test staged rollback.

## Current automated checks

1. Validate the 22-row evidence matrix structure (not the strict all-PASS approval).
2. Run the existing remediation verification test suites and cross-tenant/workspace/project approval-denial tests.
3. Run SecureNow architecture boundary tests.
4. Upload TRX evidence and JSON containing `github.sha`, the workflow run identifier, per-step outcomes and explicit `NO_GO` release decision.
5. Fail the workflow if any critical offline check fails, even when evidence upload succeeds.

`python3 scripts/ci/securenow_beta_smoke_report.py --check <evidence.json>` validates the offline portion. A green offline workflow is **not** a beta GO and cannot attest to CI freshness beyond the run's recorded SHA.

## Staging and rollback: separate owner-approved gates

Before promotion, use the **existing** staging CD mechanism and the [staging setup](../deployment/STAGING_GITHUB_ENVIRONMENT_SETUP.md). Do not create a competing CD path. Record against the same candidate SHA:

- API/worker/UI health, successful migration, readiness probes.
- Real JwtBearer operator login and negative foreign-tenant access in disposable staging.
- Successful Azure Reader-only collection and cited finding workflow.
- Missing/failed capture recovery with explicit insufficient-evidence results.
- Approved rollback of API/worker/UI to last green revision and confirmation that already-committed evidence is readable.
- On-call, support route, audit, spend freeze and human sign-off.

Production credentials, confidential inventory and rollback actions must not be embedded in fixtures or CI output. The staging workflow must be bound to a protected environment with owner approval. Human confirmation is required before turning these into mandatory deployment/promotion checks.

## Explicit boundaries

This workflow is distinct from ArchLucid architecture-review private beta. No claim of real user validation, customer ROI, SOC 2, full API tenant isolation, or live deployment success follows from offline CI.
