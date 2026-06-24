-- 057: Configurable minimum severity for pre-commit governance gate
IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'BlockCommitMinimumSeverity') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments
        ADD BlockCommitMinimumSeverity INT NULL;
END
