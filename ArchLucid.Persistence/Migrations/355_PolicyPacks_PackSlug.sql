IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'PackSlug') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks ADD PackSlug NVARCHAR(200) NULL;
END;
GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_PolicyPacks_Scope_PackSlug'
         AND object_id = OBJECT_ID(N'dbo.PolicyPacks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PolicyPacks_Scope_PackSlug
        ON dbo.PolicyPacks (TenantId, WorkspaceId, ProjectId, PackSlug)
        WHERE PackSlug IS NOT NULL AND IsDeleted = 0;
END;
GO
