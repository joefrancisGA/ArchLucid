-- Rollback notification destination configuration provenance columns.

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'LastModifiedUtc') IS NOT NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions DROP COLUMN LastModifiedUtc;
GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'LastModifiedByActor') IS NOT NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions DROP COLUMN LastModifiedByActor;
GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'CreatedByActor') IS NOT NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions DROP COLUMN CreatedByActor;
GO
