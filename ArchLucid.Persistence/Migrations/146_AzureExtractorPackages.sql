/*
  146: Customer-uploaded Azure extractor ZIP packages (schema-validated ingest; citation source for cost lines).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureExtractorPackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureExtractorPackages
    (
        PackageId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureExtractorPackages PRIMARY KEY CLUSTERED,
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId          UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NOT NULL,
        RunId                UNIQUEIDENTIFIER NULL,
        CreatedUtc            DATETIME2        NOT NULL,
        SchemaVersion         INT              NOT NULL,
        ScriptVersion         NVARCHAR(64)      NULL,
        CollectionTimestampUtc DATETIME2       NULL,
        SubscriptionId       NVARCHAR(128)      NULL,
        OriginalFileName     NVARCHAR(400)      NOT NULL,
        ManifestJson         NVARCHAR(MAX)      NOT NULL,
        PackageBytes         VARBINARY(MAX)     NOT NULL,
        CONSTRAINT FK_AzureExtractorPackages_Runs FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureExtractorPackages_Scope_Created
        ON dbo.AzureExtractorPackages (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_AzureExtractorPackages_RunId
        ON dbo.AzureExtractorPackages (RunId)
        WHERE RunId IS NOT NULL;
END;
GO
