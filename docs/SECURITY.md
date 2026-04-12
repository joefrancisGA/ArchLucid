# Security overview (ArchLucid)

This document points to security-relevant behavior and gates. It is not a full threat model; see ADRs and runbooks for depth.

## Dynamic scanning (OWASP ZAP)

The **OWASP ZAP baseline** scan runs against the **ArchLucid API Docker image** in CI (`.github/workflows/ci.yml`, job `security-zap-api-baseline`) and on a **weekly schedule** (`.github/workflows/zap-baseline-strict-scheduled.yml`). Both use `zap-baseline.py` **without** `-I`, so **warnings and failures from the scan fail the workflow** (merge gate in CI; regression catch on the schedule).

- **Configuration:** `infra/zap/baseline-pr.tsv` (mounted into the scanner container as `config/baseline-pr.tsv`).
- **Triage and rule maintenance:** [docs/security/ZAP_BASELINE_RULES.md](security/ZAP_BASELINE_RULES.md).
- **Operational layout:** [infra/zap/README.md](../infra/zap/README.md).

Other layers (authentication, RLS, rate limiting, CORS, security headers) are described in `docs/DEPLOYMENT.md`, `docs/security/MULTI_TENANT_RLS.md`, and product code under `ArchLucid.Api` / `ArchLucid.Host.Core`.
