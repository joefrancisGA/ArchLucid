/*
  Reverse DbUp 135 — dbo.CorePilotTeamChecklist (team-visible Core Pilot milestones at triple scope).
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NOT NULL
BEGIN
    REVOKE SELECT, INSERT, UPDATE ON dbo.CorePilotTeamChecklist TO [ArchLucidApp];
END;
GO


IF OBJECT_ID(N'dbo.CorePilotTeamChecklist', N'U') IS NOT NULL
    DROP TABLE dbo.CorePilotTeamChecklist;
GO
