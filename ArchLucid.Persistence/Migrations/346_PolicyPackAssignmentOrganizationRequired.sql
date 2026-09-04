/* 346: Organization-required flag on policy pack assignments (distinct from merge-precedence IsPinned). */

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'IsOrganizationRequired') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments
        ADD IsOrganizationRequired BIT NOT NULL
            CONSTRAINT DF_PolicyPackAssignments_IsOrganizationRequired DEFAULT (0);
END;
GO
