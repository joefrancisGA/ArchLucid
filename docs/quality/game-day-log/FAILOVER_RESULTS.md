> **Scope:** Staging Azure SQL manual geo-failover drill results. Production failover remains owner-gated.

# Failover drill results log

Append-only entries from `scripts/ops/run-failover-drill.ps1` (TB-905). Owner runbook: `docs/runbooks/TB-905_STAGING_RELIABILITY_DRILL.md`.

| Date | Environment | RTO (observed) | RPO (est.) | Target RTO | Target RPO | Pass | Notes |
|------|-------------|----------------|------------|------------|------------|------|-------|
| _Pending first staging execution_ | Staging | _TBD_ | _TBD_ | < 60 min | < 5 min | — | Run `./scripts/ops/run-failover-drill.ps1` after scheduling the drill |
