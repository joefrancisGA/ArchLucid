-- Rollback for 057_PolicyPackAssignments_BlockCommitMinimumSeverity.sql — DESTRUCTIVE (drops column); use with backup only.
IF COL_LENGTH('dbo.PolicyPackAssignments', 'BlockCommitMinimumSeverity') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments DROP COLUMN BlockCommitMinimumSeverity;
END
