/*
  095: CHECK constraints — status / severity / urgency domains (second wave; aligns with C# string constants).

  Idempotent: each constraint is added only when absent and no row violates the domain.

  Domains (see ArchLucid.Decisioning):
  - dbo.PolicyPacks.Status — PolicyPackStatus: Draft, Active, Retired
  - dbo.AlertDeliveryAttempts.Status — AlertDeliveryAttemptStatus: Started, Succeeded, Failed
  - dbo.AlertRecords.Severity — AlertSeverity: Info, Warning, High, Critical
  - dbo.AlertRules.Severity — same
  - dbo.AlertRoutingSubscriptions.MinimumSeverity — same
  - dbo.CompositeAlertRules.Severity — same
  - dbo.RecommendationRecords.Urgency — RecommendationGenerator MapUrgency: Critical, High, Medium, Low

  Rollback: Rollback/R095_CheckConstraints_StatusDomains_Batch.sql
*/

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_Status')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.PolicyPacks AS p
        WHERE p.Status NOT IN (N'Draft', N'Active', N'Retired'))
BEGIN
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_Status
        CHECK (Status IN (N'Draft', N'Active', N'Retired'));
END;
GO

IF OBJECT_ID(N'dbo.AlertDeliveryAttempts', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertDeliveryAttempts_Status')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertDeliveryAttempts AS a
        WHERE a.Status NOT IN (N'Started', N'Succeeded', N'Failed'))
BEGIN
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT CK_AlertDeliveryAttempts_Status
        CHECK (Status IN (N'Started', N'Succeeded', N'Failed'));
END;
GO

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRecords AS ar
        WHERE ar.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;
GO

IF OBJECT_ID(N'dbo.AlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRules_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRules AS r
        WHERE r.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRules ADD CONSTRAINT CK_AlertRules_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;
GO

IF OBJECT_ID(N'dbo.AlertRoutingSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRoutingSubscriptions_MinimumSeverity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.AlertRoutingSubscriptions AS s
        WHERE s.MinimumSeverity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.AlertRoutingSubscriptions ADD CONSTRAINT CK_AlertRoutingSubscriptions_MinimumSeverity
        CHECK (MinimumSeverity IN (N'Info', N'Warning', N'High', N'Critical'));
END;
GO

IF OBJECT_ID(N'dbo.CompositeAlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_CompositeAlertRules_Severity')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.CompositeAlertRules AS c
        WHERE c.Severity NOT IN (N'Info', N'Warning', N'High', N'Critical'))
BEGIN
    ALTER TABLE dbo.CompositeAlertRules ADD CONSTRAINT CK_CompositeAlertRules_Severity
        CHECK (Severity IN (N'Info', N'Warning', N'High', N'Critical'));
END;
GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Urgency')
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.RecommendationRecords AS rr
        WHERE rr.Urgency NOT IN (N'Critical', N'High', N'Medium', N'Low'))
BEGIN
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Urgency
        CHECK (Urgency IN (N'Critical', N'High', N'Medium', N'Low'));
END;
GO
