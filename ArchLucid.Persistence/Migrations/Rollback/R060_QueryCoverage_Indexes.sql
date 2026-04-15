-- Rollback for 060_QueryCoverage_Indexes.sql — drops indexes only.
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditEvents_EventType_OccurredUtc'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX IX_AuditEvents_EventType_OccurredUtc ON dbo.AuditEvents;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ConversationThreads_Scope_Active'
      AND object_id = OBJECT_ID(N'dbo.ConversationThreads'))
    DROP INDEX IX_ConversationThreads_Scope_Active ON dbo.ConversationThreads;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    DROP INDEX IX_GovernanceEnvironmentActivations_RunId_ActivatedUtc ON dbo.GovernanceEnvironmentActivations;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    DROP INDEX IX_GovernanceEnvironmentActivations_Environment_ActivatedUtc ON dbo.GovernanceEnvironmentActivations;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernancePromotionRecords_RunId_PromotedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    DROP INDEX IX_GovernancePromotionRecords_RunId_PromotedUtc ON dbo.GovernancePromotionRecords;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RecommendationRecords_Scope_Run_Priority'
      AND object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
    DROP INDEX IX_RecommendationRecords_Scope_Run_Priority ON dbo.RecommendationRecords;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RecommendationRecords_Scope_LastUpdatedUtc'
      AND object_id = OBJECT_ID(N'dbo.RecommendationRecords'))
    DROP INDEX IX_RecommendationRecords_Scope_LastUpdatedUtc ON dbo.RecommendationRecords;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Runs_ArchiveRetention'
      AND object_id = OBJECT_ID(N'dbo.Runs'))
    DROP INDEX IX_Runs_ArchiveRetention ON dbo.Runs;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_PolicyPackAssignments_Scope_Active'
      AND object_id = OBJECT_ID(N'dbo.PolicyPackAssignments'))
    DROP INDEX IX_PolicyPackAssignments_Scope_Active ON dbo.PolicyPackAssignments;
