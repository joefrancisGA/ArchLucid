# Architecture #5: isolated failure-recovery measurement

Run `python scripts/ci/isolated_dependency_recovery.py --output artifacts/isolated-recovery.json`.

The harness binds a synthetic readiness service to **127.0.0.1 on an ephemeral port**. It verifies HTTP 200, simulates a dependency outage by returning HTTP 503 for a bounded interval, restores readiness, and measures time to first observed HTTP 200. It produces JSON evidence with outage duration, recovery duration, probe interval, and an explicit synthetic-only classification.

This is a safety and measurement contract, **not an ArchLucid or SecureNow resilience claim**. It never contacts, stops, or alters external services or SQL. CI runs the harness with short limits and uploads the evidence artifact.

Next: provision a disposable, seeded deployment, provide a deliberately scoped failure-injection adapter (e.g., a dedicated test-only dependency proxy), collect recovery time plus data-integrity assertions, and repeat under load. Do not permit arbitrary URLs or production hosts in the failure-injection harness.
