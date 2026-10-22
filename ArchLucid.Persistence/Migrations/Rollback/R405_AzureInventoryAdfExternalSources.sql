/*
  405 rollback: remove persisted ADF linked-service identity.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryAdfExternalSources', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryAdfExternalSources;
GO
