> **Scope:** Staging Azure SQL manual geo-failover drill results. Production failover remains owner-gated.

# Failover drill results log

Append-only entries from `scripts/ops/run-failover-drill.ps1` (see `docs/runbooks/DATABASE_FAILOVER.md`).

| Drill | Environment | Observed downtime | Status |
|-------|-------------|-------------------|--------|
| _Pending first staging execution_ | Staging | _TBD_ | Run `./scripts/ops/run-failover-drill.ps1 -ApiBaseUrl <staging-api>` after scheduling the drill |
