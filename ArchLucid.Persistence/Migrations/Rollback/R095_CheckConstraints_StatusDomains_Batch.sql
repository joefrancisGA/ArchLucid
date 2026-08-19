/*
  R095: Roll back 095 — drop second-wave CHECK constraints (status / severity / urgency domains).
*/

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Urgency' AND parent_object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
    ALTER TABLE dbo.RecommendationRecords DROP CONSTRAINT CK_RecommendationRecords_Urgency;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CompositeAlertRules_Severity' AND parent_object_id = OBJECT_ID(N'dbo.CompositeAlertRules'))
    ALTER TABLE dbo.CompositeAlertRules DROP CONSTRAINT CK_CompositeAlertRules_Severity;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRoutingSubscriptions_MinimumSeverity' AND parent_object_id = OBJECT_ID(N'dbo.AlertRoutingSubscriptions'))
    ALTER TABLE dbo.AlertRoutingSubscriptions DROP CONSTRAINT CK_AlertRoutingSubscriptions_MinimumSeverity;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRules_Severity' AND parent_object_id = OBJECT_ID(N'dbo.AlertRules'))
    ALTER TABLE dbo.AlertRules DROP CONSTRAINT CK_AlertRules_Severity;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Severity' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT CK_AlertRecords_Severity;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertDeliveryAttempts_Status' AND parent_object_id = OBJECT_ID(N'dbo.AlertDeliveryAttempts'))
    ALTER TABLE dbo.AlertDeliveryAttempts DROP CONSTRAINT CK_AlertDeliveryAttempts_Status;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_Status' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPacks'))
    ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT CK_PolicyPacks_Status;
GO
