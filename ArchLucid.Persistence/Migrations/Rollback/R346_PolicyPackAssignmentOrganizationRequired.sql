-- Rollback for 346_PolicyPackAssignmentOrganizationRequired.sql

IF COL_LENGTH(N'dbo.PolicyPackAssignments', N'IsOrganizationRequired') IS NOT NULL
BEGIN
    DECLARE @dfName sysname;

    SELECT @dfName = dc.name
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.PolicyPackAssignments')
      AND c.name = N'IsOrganizationRequired';

    IF @dfName IS NOT NULL
        EXEC (N'ALTER TABLE dbo.PolicyPackAssignments DROP CONSTRAINT ' + QUOTENAME(@dfName) + N';');

    ALTER TABLE dbo.PolicyPackAssignments DROP COLUMN IsOrganizationRequired;
END;
GO
