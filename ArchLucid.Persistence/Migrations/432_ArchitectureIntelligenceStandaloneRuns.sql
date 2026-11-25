/* Scope and actor bindings for server-issued standalone Architecture Intelligence runs. */
IF OBJECT_ID(N'dbo.ArchitectureIntelligenceStandaloneRuns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureIntelligenceStandaloneRuns
    (
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ActorKeyHash BINARY(32) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL
            CONSTRAINT DF_ArchitectureIntelligenceStandaloneRuns_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ArchitectureIntelligenceStandaloneRuns PRIMARY KEY (RunId)
    );
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
    GRANT SELECT, INSERT ON OBJECT::dbo.ArchitectureIntelligenceStandaloneRuns TO [ArchLucidApp];
GO
