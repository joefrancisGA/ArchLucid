/*
  Rollback 356: drop operational security finding tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindingObservations', N'U') IS NOT NULL
    DROP TABLE dbo.OperationalSecurityFindingObservations;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindingMetadata', N'U') IS NOT NULL
    DROP TABLE dbo.OperationalSecurityFindingMetadata;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
    DROP TABLE dbo.OperationalSecurityFindings;
GO
