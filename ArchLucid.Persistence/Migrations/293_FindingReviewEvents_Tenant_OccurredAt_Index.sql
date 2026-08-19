/* 293 — FindingReviewEvents (TenantId, OccurredAtUtc) index.

   ListSinceUtcAsync filters WHERE TenantId = @t AND OccurredAtUtc >= @since (ROI basis breakdown,
   realized value, trailing 30-day metrics). The only existing index leads with FindingId
   (IX_FindingReviewEvents_Tenant_Finding), so tenant+time windows scanned. This index turns them
   into range seeks. */

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1
                   FROM sys.indexes
                   WHERE name = N'IX_FindingReviewEvents_Tenant_OccurredAt'
                     AND object_id = OBJECT_ID(N'dbo.FindingReviewEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingReviewEvents_Tenant_OccurredAt
        ON dbo.FindingReviewEvents (TenantId, OccurredAtUtc DESC);
END;
GO
