/*
  369: CA-49 — soft-archive customer architecture identities (ADR 0074).

  ArchivedUtc hides the identity from the default Working portfolio without
  deleting child drafts, reviews, or sealed records.
*/

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Architectures', N'ArchivedUtc') IS NULL
    BEGIN
        ALTER TABLE dbo.Architectures
            ADD ArchivedUtc DATETIME2(7) NULL;
    END
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'ArchivedUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Architectures_Scope_ActiveUpdatedUtc'
         AND object_id = OBJECT_ID(N'dbo.Architectures'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Architectures_Scope_ActiveUpdatedUtc
        ON dbo.Architectures (TenantId, WorkspaceId, ScopeProjectId, UpdatedUtc DESC, ArchitectureId DESC)
        WHERE ArchivedUtc IS NULL;
END;
GO
