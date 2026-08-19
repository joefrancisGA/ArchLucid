/*
  Reverse DbUp 159 — dbo.CommitRunIdempotency, dbo.ProjectRoleAssignments.
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
BEGIN
    REVOKE SELECT, INSERT, UPDATE, DELETE ON dbo.ProjectRoleAssignments TO [ArchLucidApp];
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
BEGIN
    REVOKE SELECT, INSERT, UPDATE, DELETE ON dbo.CommitRunIdempotency TO [ArchLucidApp];
END;
GO



IF OBJECT_ID(N'dbo.ProjectRoleAssignments', N'U') IS NOT NULL
    DROP TABLE dbo.ProjectRoleAssignments;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
    DROP TABLE dbo.CommitRunIdempotency;
GO
