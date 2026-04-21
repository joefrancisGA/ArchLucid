IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchiforgeTenantScope')
   AND OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchiforgeTenantScope
        DROP FILTER PREDICATE ON dbo.FindingFeedback,
        DROP BLOCK PREDICATE ON dbo.FindingFeedback FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.FindingFeedback FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.FindingFeedback FOR BEFORE DELETE;
END;
GO

IF OBJECT_ID(N'dbo.FindingFeedback', N'U') IS NOT NULL
    DROP TABLE dbo.FindingFeedback;
GO
