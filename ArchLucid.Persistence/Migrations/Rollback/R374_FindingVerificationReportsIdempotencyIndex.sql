IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FindingVerificationReports_Idempotency'
      AND object_id = OBJECT_ID(N'dbo.FindingVerificationReports'))
BEGIN
    DROP INDEX IX_FindingVerificationReports_Idempotency ON dbo.FindingVerificationReports;
END;
GO
