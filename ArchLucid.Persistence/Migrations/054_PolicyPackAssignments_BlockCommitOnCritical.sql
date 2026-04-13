/* Optional pre-commit governance gate: block manifest commit when critical findings exist and assignment enforces. */

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'BlockCommitOnCritical') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD BlockCommitOnCritical BIT NOT NULL
        CONSTRAINT DF_PolicyPackAssignments_BlockCommitOnCritical DEFAULT (0);
GO
