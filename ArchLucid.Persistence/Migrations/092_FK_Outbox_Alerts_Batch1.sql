/*
  092: Foreign keys — batch 1 (outbox RunId → dbo.Runs; alert chain referential integrity).

  Idempotent: each FK is added only when absent and prerequisites exist.

  Data hygiene (brownfield-safe):
  - dbo.IntegrationEventOutbox.RunId (nullable): set NULL when no matching dbo.Runs row.
  - dbo.AlertRecords: set RunId, ComparedToRunId, RecommendationId to NULL when references are invalid.
  - dbo.AlertDeliveryAttempts: DELETE rows whose AlertId or RoutingSubscriptionId has no parent (orphan attempts).

  Conditional add (no data mutation): FK is not created when orphan rows would violate the constraint — remediate
  and re-run DbUp or ship a follow-up migration. Applies to:
  - dbo.RetrievalIndexingOutbox.RunId → dbo.Runs (NOT NULL)
  - dbo.AuthorityPipelineWorkOutbox.RunId → dbo.Runs (NOT NULL)
  - dbo.AlertRecords.RuleId → dbo.AlertRules (NOT NULL)

  Rollback: Drop constraints only — see Rollback/R092_FK_Outbox_Alerts_Batch1.sql.
*/

/* ---- Nullable RunId cleanup (integration events may be run-agnostic) ---- */
IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    UPDATE o
    SET RunId = NULL
    FROM dbo.IntegrationEventOutbox AS o
    WHERE o.RunId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = o.RunId);
END;
GO

/* ---- AlertRecords: null out invalid optional references ---- */
IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    UPDATE ar
    SET RunId = NULL
    FROM dbo.AlertRecords AS ar
    WHERE ar.RunId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = ar.RunId);

    UPDATE ar
    SET ComparedToRunId = NULL
    FROM dbo.AlertRecords AS ar
    WHERE ar.ComparedToRunId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = ar.ComparedToRunId);
END;
GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
BEGIN
    UPDATE ar
    SET RecommendationId = NULL
    FROM dbo.AlertRecords AS ar
    WHERE ar.RecommendationId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.RecommendationRecords AS rr WHERE rr.RecommendationId = ar.RecommendationId);
END;
GO

/* ---- Orphan delivery attempts (no parent row to attach) ---- */
IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
BEGIN
    DELETE ada
    FROM dbo.AlertDeliveryAttempts AS ada
    WHERE NOT EXISTS (SELECT 1 FROM dbo.AlertRecords AS ar WHERE ar.AlertId = ada.AlertId)
       OR NOT EXISTS (SELECT 1 FROM dbo.AlertRoutingSubscriptions AS rs WHERE rs.RoutingSubscriptionId = ada.RoutingSubscriptionId);
END;
GO

/* ---- Outbox → Runs ---- */
IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_IntegrationEventOutbox_Runs_RunId')
BEGIN
    ALTER TABLE dbo.IntegrationEventOutbox ADD CONSTRAINT FK_IntegrationEventOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RetrievalIndexingOutbox_Runs_RunId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.RetrievalIndexingOutbox AS o
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = o.RunId))
BEGIN
    ALTER TABLE dbo.RetrievalIndexingOutbox ADD CONSTRAINT FK_RetrievalIndexingOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AuthorityPipelineWorkOutbox_Runs_RunId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AuthorityPipelineWorkOutbox AS o
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = o.RunId))
BEGIN
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox ADD CONSTRAINT FK_AuthorityPipelineWorkOutbox_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

/* ---- AlertRecords → AlertRules / Runs / RecommendationRecords ---- */
IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_AlertRules_RuleId')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE NOT EXISTS (SELECT 1 FROM dbo.AlertRules AS ru WHERE ru.RuleId = ar.RuleId))
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_AlertRules_RuleId
        FOREIGN KEY (RuleId) REFERENCES dbo.AlertRules (RuleId);
END;
GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_RunId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_ComparedToRunId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_Runs_ComparedToRunId
        FOREIGN KEY (ComparedToRunId) REFERENCES dbo.Runs (RunId);
END;
GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_RecommendationRecords_RecommendationId')
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT FK_AlertRecords_RecommendationRecords_RecommendationId
        FOREIGN KEY (RecommendationId) REFERENCES dbo.RecommendationRecords (RecommendationId);
END;
GO

/* ---- AlertDeliveryAttempts → parents ---- */
IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRecords_AlertId')
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT FK_AlertDeliveryAttempts_AlertRecords_AlertId
        FOREIGN KEY (AlertId) REFERENCES dbo.AlertRecords (AlertId);
END;
GO

IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId')
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId
        FOREIGN KEY (RoutingSubscriptionId) REFERENCES dbo.AlertRoutingSubscriptions (RoutingSubscriptionId);
END;
GO
