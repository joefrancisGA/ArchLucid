/*
  Roll back DbUp 213 — drop FK constraints added for policy pack, advisory, composite alerts, and provenance.
*/

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProvenanceSnapshots_Runs' AND parent_object_id = OBJECT_ID(N'dbo.ProvenanceSnapshots'))
    ALTER TABLE dbo.ProvenanceSnapshots DROP CONSTRAINT FK_ProvenanceSnapshots_Runs;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Subscriptions' AND parent_object_id = OBJECT_ID(N'dbo.DigestDeliveryAttempts'))
    ALTER TABLE dbo.DigestDeliveryAttempts DROP CONSTRAINT FK_DigestDeliveryAttempts_Subscriptions;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Digests' AND parent_object_id = OBJECT_ID(N'dbo.DigestDeliveryAttempts'))
    ALTER TABLE dbo.DigestDeliveryAttempts DROP CONSTRAINT FK_DigestDeliveryAttempts_Digests;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AdvisoryScanExecutions_Schedules' AND parent_object_id = OBJECT_ID(N'dbo.AdvisoryScanExecutions'))
    ALTER TABLE dbo.AdvisoryScanExecutions DROP CONSTRAINT FK_AdvisoryScanExecutions_Schedules;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CompositeAlertRuleConditions_CompositeAlertRules' AND parent_object_id = OBJECT_ID(N'dbo.CompositeAlertRuleConditions'))
    ALTER TABLE dbo.CompositeAlertRuleConditions DROP CONSTRAINT FK_CompositeAlertRuleConditions_CompositeAlertRules;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackChangeLog_PolicyPacks' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPackChangeLog'))
    ALTER TABLE dbo.PolicyPackChangeLog DROP CONSTRAINT FK_PolicyPackChangeLog_PolicyPacks;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackAssignments_PolicyPacks' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPackAssignments'))
    ALTER TABLE dbo.PolicyPackAssignments DROP CONSTRAINT FK_PolicyPackAssignments_PolicyPacks;
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackVersions_PolicyPacks' AND parent_object_id = OBJECT_ID(N'dbo.PolicyPackVersions'))
    ALTER TABLE dbo.PolicyPackVersions DROP CONSTRAINT FK_PolicyPackVersions_PolicyPacks;
GO
