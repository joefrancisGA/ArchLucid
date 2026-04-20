/*
  R092: Roll back 092 — drop batch-1 foreign keys (outbox + alerts).

  Does not restore deleted AlertDeliveryAttempts rows or re-populate nulled RunId / optional alert columns.
*/

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId' AND parent_object_id = OBJECT_ID(N'dbo.AlertDeliveryAttempts'))
    ALTER TABLE dbo.AlertDeliveryAttempts DROP CONSTRAINT FK_AlertDeliveryAttempts_AlertRoutingSubscriptions_RoutingSubscriptionId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertDeliveryAttempts_AlertRecords_AlertId' AND parent_object_id = OBJECT_ID(N'dbo.AlertDeliveryAttempts'))
    ALTER TABLE dbo.AlertDeliveryAttempts DROP CONSTRAINT FK_AlertDeliveryAttempts_AlertRecords_AlertId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_RecommendationRecords_RecommendationId' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT FK_AlertRecords_RecommendationRecords_RecommendationId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_ComparedToRunId' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT FK_AlertRecords_Runs_ComparedToRunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT FK_AlertRecords_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AlertRecords_AlertRules_RuleId' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT FK_AlertRecords_AlertRules_RuleId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AuthorityPipelineWorkOutbox_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
    ALTER TABLE dbo.AuthorityPipelineWorkOutbox DROP CONSTRAINT FK_AuthorityPipelineWorkOutbox_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_RetrievalIndexingOutbox_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
    ALTER TABLE dbo.RetrievalIndexingOutbox DROP CONSTRAINT FK_RetrievalIndexingOutbox_Runs_RunId;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_IntegrationEventOutbox_Runs_RunId' AND parent_object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
    ALTER TABLE dbo.IntegrationEventOutbox DROP CONSTRAINT FK_IntegrationEventOutbox_Runs_RunId;
GO
