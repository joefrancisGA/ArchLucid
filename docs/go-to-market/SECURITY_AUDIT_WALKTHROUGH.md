> **Scope:** Security-reviewer walkthrough for one architecture review — uses existing routes and exports only.

# Security audit walkthrough (one review)

**Audience:** Security and compliance reviewers who need a concrete trace without reading the whole repository.

**Not claimed:** SOC 2 CPA attestation, third-party pen-test publication, or customer-specific legal opinions.

## Example path (committed review)

Assume review id `runId` and tenant scope already established.

| Step | What to inspect | Surface |
| --- | --- | --- |
| 1 | Confirm review is **Committed** | `GET /v1/architecture/run/{runId}` or operator UI `/reviews/{runId}` |
| 2 | Record **manifest id** and commit timestamp | Run detail · `GoldenManifest.Metadata.CreatedUtc` |
| 3 | Export or query **audit events** for the run window | `GET /v1/audit/events` (scoped) · CSV export · SIEM path in [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) |
| 4 | Capture **correlation id** from a failed or successful API call | Response header `X-Correlation-ID` |
| 5 | Open **top finding evidence chain** | First-value report evidence card · `GET` finding evidence-chain endpoints per [`../library/API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| 6 | Verify **artifact descriptors** for the committed manifest | Review detail artifacts table · evidence bundle `artifact-manifest.json` |
| 7 | Attach **procurement pack** when buyer review requires policies | `python scripts/build_procurement_pack.py --strict` — see [`procurement-pack-quality.md`](../../scripts/build_procurement_pack.py) after build |

## Limitations

- Audit volume can be large — filter by run id, time window, and event type.
- Retention follows environment configuration — see [`../library/AUDIT_RETENTION_EXTENSION.md`](../library/AUDIT_RETENTION_EXTENSION.md).
- Row-level security is optional; primary isolation is database-per-tenant — [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md).

## Related

- [`TRUST_CENTER.md`](TRUST_CENTER.md)
- [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md)
- [`AI_OUTPUT_DECISION_SUPPORT.md`](AI_OUTPUT_DECISION_SUPPORT.md)
