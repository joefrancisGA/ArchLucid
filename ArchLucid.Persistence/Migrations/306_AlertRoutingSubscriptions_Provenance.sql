-- Notification destination configuration provenance for operator audit surfaces.

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'CreatedByActor') IS NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions ADD CreatedByActor NVARCHAR(300) NULL;
GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'LastModifiedByActor') IS NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions ADD LastModifiedByActor NVARCHAR(300) NULL;
GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRoutingSubscriptions', N'LastModifiedUtc') IS NULL
    ALTER TABLE dbo.AlertRoutingSubscriptions ADD LastModifiedUtc DATETIME2(7) NULL;
GO
