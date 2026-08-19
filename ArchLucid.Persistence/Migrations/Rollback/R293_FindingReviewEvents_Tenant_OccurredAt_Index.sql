/*
  R293: Rollback 293_FindingReviewEvents_Tenant_OccurredAt_Index.sql —
  drop IX_FindingReviewEvents_Tenant_OccurredAt.
*/

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND EXISTS (SELECT 1
               FROM sys.indexes
               WHERE name = N'IX_FindingReviewEvents_Tenant_OccurredAt'
                 AND object_id = OBJECT_ID(N'dbo.FindingReviewEvents'))
BEGIN
    DROP INDEX IX_FindingReviewEvents_Tenant_OccurredAt ON dbo.FindingReviewEvents;
END;
GO
