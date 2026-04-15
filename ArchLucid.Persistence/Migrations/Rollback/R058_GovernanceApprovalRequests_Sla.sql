-- Rollback for 058_GovernanceApprovalRequests_Sla.sql — DESTRUCTIVE (drops columns); use with backup only.
IF COL_LENGTH('dbo.GovernanceApprovalRequests', 'SlaBreachNotifiedUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests DROP COLUMN SlaBreachNotifiedUtc;
END

IF COL_LENGTH('dbo.GovernanceApprovalRequests', 'SlaDeadlineUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests DROP COLUMN SlaDeadlineUtc;
END
