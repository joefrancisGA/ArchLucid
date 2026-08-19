/*
  Reverse DbUp 169 — dbo.AuthorityPipelineTenantExecutionLease.
*/
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.AuthorityPipelineTenantExecutionLease', N'U') IS NOT NULL

    DROP TABLE dbo.AuthorityPipelineTenantExecutionLease;

GO
