/*
  411: Scope documentation decision history to the parsed diagram model (RTA-05).
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.InfrastructureDiagramComparisons', N'DiagramFingerprint') IS NULL
BEGIN
    ALTER TABLE dbo.InfrastructureDiagramComparisons
        ADD DiagramFingerprint NVARCHAR(64) NULL;
END;
GO

IF COL_LENGTH(N'dbo.InfrastructureDiagramDocumentationDecisions', N'DiagramFingerprint') IS NULL
BEGIN
    ALTER TABLE dbo.InfrastructureDiagramDocumentationDecisions
        ADD DiagramFingerprint NVARCHAR(64) NULL;
END;
GO
