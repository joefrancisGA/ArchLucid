/* Rollback DbUp 264 — drop per-tenant hosted GCP extractor connection records. */
IF OBJECT_ID(N'dbo.TenantGcpConnectionRecords', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantGcpConnectionRecords;
END;
GO
