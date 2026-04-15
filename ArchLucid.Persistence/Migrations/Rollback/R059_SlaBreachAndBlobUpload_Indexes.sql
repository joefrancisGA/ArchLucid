-- Rollback for 059_SlaBreachAndBlobUpload_Indexes.sql — drops indexes only.
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_PendingSlaBreached'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    DROP INDEX IX_GovernanceApprovalRequests_PendingSlaBreached ON dbo.GovernanceApprovalRequests;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_GovernanceApprovalRequests_Status_RequestedUtc'
      AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    DROP INDEX IX_GovernanceApprovalRequests_Status_RequestedUtc ON dbo.GovernanceApprovalRequests;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AgentExecutionTraces_BlobUploadFailed'
      AND object_id = OBJECT_ID(N'dbo.AgentExecutionTraces'))
    DROP INDEX IX_AgentExecutionTraces_BlobUploadFailed ON dbo.AgentExecutionTraces;
