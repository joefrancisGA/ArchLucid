/*
  Improvement #31 — CHECK constraints on enumeration columns (idempotent).

  Values align with C# constants (PolicyPackType, GovernanceScopeLevel, FindingSeverity, ConversationMessageRole).
  Overlaps with migration 095 are guarded with IF NOT EXISTS.
*/

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Status')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.AlertRecords AS ar
        WHERE ar.Status NOT IN (N'Open', N'Acknowledged', N'Resolved', N'Suppressed'))
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Status
        CHECK (Status IN (N'Open', N'Acknowledged', N'Resolved', N'Suppressed'));
END;
GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Status')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.RecommendationRecords AS rr
        WHERE rr.Status NOT IN (N'Proposed', N'Accepted', N'Rejected', N'Deferred', N'Implemented'))
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Status
        CHECK (Status IN (N'Proposed', N'Accepted', N'Rejected', N'Deferred', N'Implemented'));
END;
GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DigestDeliveryAttempts_Status')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.DigestDeliveryAttempts AS d
        WHERE d.Status NOT IN (N'Started', N'Succeeded', N'Failed'))
BEGIN
    ALTER TABLE dbo.DigestDeliveryAttempts ADD CONSTRAINT CK_DigestDeliveryAttempts_Status
        CHECK (Status IN (N'Started', N'Succeeded', N'Failed'));
END;
GO

IF OBJECT_ID(N'dbo.AdvisoryScanExecutions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AdvisoryScanExecutions_Status')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.AdvisoryScanExecutions AS e
        WHERE e.Status NOT IN (N'Started', N'Completed', N'Failed'))
BEGIN
    ALTER TABLE dbo.AdvisoryScanExecutions ADD CONSTRAINT CK_AdvisoryScanExecutions_Status
        CHECK (Status IN (N'Started', N'Completed', N'Failed'));
END;
GO

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_PackType')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.PolicyPacks AS p
        WHERE p.PackType NOT IN (
            N'BuiltIn', N'PlatformDefault', N'TenantCustom', N'WorkspaceCustom', N'ProjectCustom'))
BEGIN
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_PackType
        CHECK (PackType IN (
            N'BuiltIn', N'PlatformDefault', N'TenantCustom', N'WorkspaceCustom', N'ProjectCustom'));
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPackAssignments_ScopeLevel')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.PolicyPackAssignments AS a
        WHERE a.ScopeLevel NOT IN (N'Tenant', N'Workspace', N'Project'))
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments ADD CONSTRAINT CK_PolicyPackAssignments_ScopeLevel
        CHECK (ScopeLevel IN (N'Tenant', N'Workspace', N'Project'));
END;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_Severity')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.FindingRecords AS f
        WHERE f.Severity NOT IN (N'Info', N'Warning', N'Error', N'Critical'))
BEGIN
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'Error', N'Critical'));
END;
GO

IF OBJECT_ID(N'dbo.ConversationMessages', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ConversationMessages_Role')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.ConversationMessages AS m
        WHERE m.Role NOT IN (N'User', N'Assistant', N'System'))
BEGIN
    ALTER TABLE dbo.ConversationMessages ADD CONSTRAINT CK_ConversationMessages_Role
        CHECK (Role IN (N'User', N'Assistant', N'System'));
END;
GO

IF OBJECT_ID(N'dbo.ImportedArchitectureRequests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImportedArchitectureRequests_Status')
   AND NOT EXISTS (
        SELECT 1 FROM dbo.ImportedArchitectureRequests AS i
        WHERE i.Status NOT IN (N'Draft', N'Processing', N'Completed', N'Failed'))
BEGIN
    ALTER TABLE dbo.ImportedArchitectureRequests ADD CONSTRAINT CK_ImportedArchitectureRequests_Status
        CHECK (Status IN (N'Draft', N'Processing', N'Completed', N'Failed'));
END;
GO
