> **Scope:** Contributor security testing — dynamic scanning and API fuzzing in CI and scheduled jobs.
>
> **Status:** current

# Security testing runbook

## Dynamic scanning (OWASP ZAP)

The **OWASP ZAP baseline** scan runs against the **ArchLucid API Docker image** in CI (`.github/workflows/ci.yml`, job `security-zap-api-baseline`) and on a **weekly schedule** (`.github/workflows/zap-baseline-strict-scheduled.yml`). Both use `zap-baseline.py` **without** `-I`, so **warnings and failures from the scan fail the workflow** (merge gate in CI; regression catch on the schedule).

- **Configuration:** `infra/zap/baseline-pr.tsv` (mounted into the scanner container as `config/baseline-pr.tsv`).
- **Triage and rule maintenance:** [docs/security/ZAP_BASELINE_RULES.md](ZAP_BASELINE_RULES.md).
- **Operational layout:** [infra/zap/README.md](../../../infra/zap/README.md).

Other layers (authentication, tenant isolation, rate limiting, CORS, security headers) are described in `docs/DEPLOYMENT.md`, `docs/security/MULTI_TENANT_RLS.md`, and product code under `ArchLucid.Api` / `ArchLucid.Host.Core`.

## OpenAPI-driven fuzzing (Schemathesis, PR + schedule)

Merge-blocking **Schemathesis light** runs on every PR after full .NET regression: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) job **`api-schemathesis-light`** builds the API image, starts the container, and runs **`--phases=examples`** against **`/openapi/v1.json`** with **`--checks=all`** (response schema and status conformance). Full fuzzing and stateful phases run weekly — see **[docs/API_FUZZ_TESTING.md](../library/API_FUZZ_TESTING.md)**.

## Related reads

- **[API_KEY_ROTATION.md](../runbooks/API_KEY_ROTATION.md)** — API key rotation (comma-separated overlap).
- **[SYSTEM_THREAT_MODEL.md](SYSTEM_THREAT_MODEL.md)** — STRIDE summary at the product boundary.
- **[RLS_RISK_ACCEPTANCE.md](RLS_RISK_ACCEPTANCE.md)** — RLS residual risk acceptance template (historical).
