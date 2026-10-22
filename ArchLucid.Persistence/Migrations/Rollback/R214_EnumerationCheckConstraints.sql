/* Rollback for 214_EnumerationCheckConstraints.sql */

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImportedArchitectureRequests_Status' AND parent_object_id = OBJECT_ID(N'dbo.ImportedArchitectureRequests'))
    ALTER TABLE dbo.ImportedArchitectureRequests DROP CONSTRAINT CK_ImportedArchitectureRequests_Status;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ConversationMessages_Role' AND parent_object_id = OBJECT_ID(N'dbo.ConversationMessages'))
    ALTER TABLE dbo.ConversationMessages DROP CONSTRAINT CK_ConversationMessages_Role;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_Severity' AND parent_object_id = OBJECT_ID(N'dbo.FindingRecords'))
    ALTER TABLE dbo.FindingRecords DROP CONSTRAINT CK_FindingRecords_Severity;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPackAssignments_ScopeLevel' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPackAssignments'))
    ALTER TABLE dbo.PolicyPackAssignments DROP CONSTRAINT CK_PolicyPackAssignments_ScopeLevel;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_PackType' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPacks'))
    ALTER TABLE dbo.PolicyPacks DROP CONSTRAINT CK_PolicyPacks_PackType;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AdvisoryScanExecutions_Status' AND parent_object_id = OBJECT_ID(N'dbo.AdvisoryScanExecutions'))
    ALTER TABLE dbo.AdvisoryScanExecutions DROP CONSTRAINT CK_AdvisoryScanExecutions_Status;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DigestDeliveryAttempts_Status' AND parent_object_id = OBJECT_ID(N'dbo.DigestDeliveryAttempts'))
    ALTER TABLE dbo.DigestDeliveryAttempts DROP CONSTRAINT CK_DigestDeliveryAttempts_Status;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Status' AND parent_object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
    ALTER TABLE dbo.RecommendationRecords DROP CONSTRAINT CK_RecommendationRecords_Status;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Status' AND parent_object_id = OBJECT_ID(N'dbo.AlertRecords'))
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT CK_AlertRecords_Status;
GO
