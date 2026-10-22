/*
  R400: Restore the tenant-only operational security finding natural key.
*/
IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [name] = N'UQ_OperationalSecurityFindings_ScopedNaturalKey'
          AND [parent_object_id] = OBJECT_ID(N'dbo.OperationalSecurityFindings')
    )
        ALTER TABLE dbo.OperationalSecurityFindings
            DROP CONSTRAINT UQ_OperationalSecurityFindings_ScopedNaturalKey;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE [name] = N'UQ_OperationalSecurityFindings_NaturalKey'
          AND [parent_object_id] = OBJECT_ID(N'dbo.OperationalSecurityFindings')
    )
        ALTER TABLE dbo.OperationalSecurityFindings
            ADD CONSTRAINT UQ_OperationalSecurityFindings_NaturalKey
                UNIQUE (TenantId, Provider, SourceSystem, SourceFindingId);
END;
GO
