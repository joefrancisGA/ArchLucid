/* Rollback DbUp 263 — drop per-tenant hosted AWS extractor connection records. */
IF OBJECT_ID(N'dbo.TenantAwsConnectionRecords', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantAwsConnectionRecords;
END;
GO
