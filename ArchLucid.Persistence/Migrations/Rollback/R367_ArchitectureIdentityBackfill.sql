/*
  R367: Rollback 367_ArchitectureIdentityBackfill.sql

  Forward migration links legacy DraftRequests rows to run architecture identities.
  That data correction is not safely reversible without losing audit context, so
  rollback is intentionally a no-op.
*/

GO
