/*
  Scope operational security finding natural keys by tenant/workspace/project.
  Source systems may legitimately reuse the same provider/source finding id in different projects.
*/
IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [name] = N'UQ_OperationalSecurityFindings_NaturalKey'
          AND [parent_object_id] = OBJECT_ID(N'dbo.OperationalSecurityFindings')
    )
    BEGIN
        ALTER TABLE dbo.OperationalSecurityFindings
            DROP CONSTRAINT UQ_OperationalSecurityFindings_NaturalKey;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [name] = N'UQ_OperationalSecurityFindings_ScopedNaturalKey'
          AND [parent_object_id] = OBJECT_ID(N'dbo.OperationalSecurityFindings')
    )
    BEGIN
        ALTER TABLE dbo.OperationalSecurityFindings
            ADD CONSTRAINT UQ_OperationalSecurityFindings_ScopedNaturalKey
                UNIQUE (TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId);
    END;
END;
GO
