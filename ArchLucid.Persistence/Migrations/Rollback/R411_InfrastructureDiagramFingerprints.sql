IF COL_LENGTH(N'dbo.InfrastructureDiagramComparisons', N'DiagramFingerprint') IS NOT NULL
BEGIN
    ALTER TABLE dbo.InfrastructureDiagramComparisons
        DROP COLUMN DiagramFingerprint;
END;
GO

IF COL_LENGTH(N'dbo.InfrastructureDiagramDocumentationDecisions', N'DiagramFingerprint') IS NOT NULL
BEGIN
    ALTER TABLE dbo.InfrastructureDiagramDocumentationDecisions
        DROP COLUMN DiagramFingerprint;
END;
GO
