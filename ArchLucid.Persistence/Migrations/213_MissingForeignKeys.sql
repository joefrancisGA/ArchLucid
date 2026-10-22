/*
  Improvement #30 — Missing FK constraints (policy pack, advisory, composite alerts, provenance).

  Idempotent. Orphan rows are deleted (delivery/execution attempts) or removed (provenance) before NOT NULL FK add.
  Alert/outbox/conversation FKs were shipped in migrations 092–093; this migration closes the remaining gaps.
*/

IF OBJECT_ID(N'dbo.PolicyPackVersions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
BEGIN
    DELETE v
    FROM dbo.PolicyPackVersions AS v
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PolicyPacks AS p WHERE p.PolicyPackId = v.PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
BEGIN
    DELETE a
    FROM dbo.PolicyPackAssignments AS a
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PolicyPacks AS p WHERE p.PolicyPackId = a.PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackChangeLog', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
BEGIN
    DELETE c
    FROM dbo.PolicyPackChangeLog AS c
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PolicyPacks AS p WHERE p.PolicyPackId = c.PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.CompositeAlertRuleConditions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.CompositeAlertRules', N'U') IS NOT NULL
BEGIN
    DELETE c
    FROM dbo.CompositeAlertRuleConditions AS c
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CompositeAlertRules AS r WHERE r.CompositeRuleId = c.CompositeRuleId);
END;
GO

IF OBJECT_ID(N'dbo.AdvisoryScanExecutions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AdvisoryScanSchedules', N'U') IS NOT NULL
BEGIN
    DELETE e
    FROM dbo.AdvisoryScanExecutions AS e
    WHERE NOT EXISTS (SELECT 1 FROM dbo.AdvisoryScanSchedules AS s WHERE s.ScheduleId = e.ScheduleId);
END;
GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ArchitectureDigests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.DigestSubscriptions', N'U') IS NOT NULL
BEGIN
    DELETE d
    FROM dbo.DigestDeliveryAttempts AS d
    WHERE NOT EXISTS (SELECT 1 FROM dbo.ArchitectureDigests AS dig WHERE dig.DigestId = d.DigestId)
       OR NOT EXISTS (SELECT 1 FROM dbo.DigestSubscriptions AS sub WHERE sub.SubscriptionId = d.SubscriptionId);
END;
GO

IF OBJECT_ID(N'dbo.ProvenanceSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    DELETE ps
    FROM dbo.ProvenanceSnapshots AS ps
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Runs AS r WHERE r.RunId = ps.RunId);
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackVersions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackVersions_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackVersions WITH NOCHECK
        ADD CONSTRAINT FK_PolicyPackVersions_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackAssignments_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackAssignments WITH NOCHECK
        ADD CONSTRAINT FK_PolicyPackAssignments_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.PolicyPackChangeLog', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PolicyPackChangeLog_PolicyPacks')
BEGIN
    ALTER TABLE dbo.PolicyPackChangeLog WITH NOCHECK
        ADD CONSTRAINT FK_PolicyPackChangeLog_PolicyPacks
        FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);
END;
GO

IF OBJECT_ID(N'dbo.CompositeAlertRuleConditions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.CompositeAlertRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CompositeAlertRuleConditions_CompositeAlertRules')
BEGIN
    ALTER TABLE dbo.CompositeAlertRuleConditions WITH NOCHECK
        ADD CONSTRAINT FK_CompositeAlertRuleConditions_CompositeAlertRules
        FOREIGN KEY (CompositeRuleId) REFERENCES dbo.CompositeAlertRules (CompositeRuleId);
END;
GO

IF OBJECT_ID(N'dbo.AdvisoryScanExecutions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AdvisoryScanSchedules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AdvisoryScanExecutions_Schedules')
BEGIN
    ALTER TABLE dbo.AdvisoryScanExecutions WITH NOCHECK
        ADD CONSTRAINT FK_AdvisoryScanExecutions_Schedules
        FOREIGN KEY (ScheduleId) REFERENCES dbo.AdvisoryScanSchedules (ScheduleId);
END;
GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.ArchitectureDigests', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Digests')
BEGIN
    ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK
        ADD CONSTRAINT FK_DigestDeliveryAttempts_Digests
        FOREIGN KEY (DigestId) REFERENCES dbo.ArchitectureDigests (DigestId);
END;
GO

IF OBJECT_ID(N'dbo.DigestDeliveryAttempts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.DigestSubscriptions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DigestDeliveryAttempts_Subscriptions')
BEGIN
    ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK
        ADD CONSTRAINT FK_DigestDeliveryAttempts_Subscriptions
        FOREIGN KEY (SubscriptionId) REFERENCES dbo.DigestSubscriptions (SubscriptionId);
END;
GO

IF OBJECT_ID(N'dbo.ProvenanceSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProvenanceSnapshots_Runs')
BEGIN
    ALTER TABLE dbo.ProvenanceSnapshots WITH NOCHECK
        ADD CONSTRAINT FK_ProvenanceSnapshots_Runs
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END;
GO
