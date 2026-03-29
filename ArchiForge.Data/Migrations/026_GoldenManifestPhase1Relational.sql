-- Phase-1 GoldenManifest relational slices (dual-write with JSON columns). Mirrors ArchiForge.Data/SQL/ArchiForge.sql.
IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestAssumptions
    (
        ManifestId      UNIQUEIDENTIFIER NOT NULL,
        SortOrder       INT NOT NULL,
        AssumptionText  NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GoldenManifestAssumptions PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestAssumptions_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestAssumptions_ManifestId
        ON dbo.GoldenManifestAssumptions (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestWarnings
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        WarningText  NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_GoldenManifestWarnings PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestWarnings_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestWarnings_ManifestId
        ON dbo.GoldenManifestWarnings (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisions
    (
        ManifestId       UNIQUEIDENTIFIER NOT NULL,
        SortOrder        INT NOT NULL,
        DecisionId       NVARCHAR(200) NOT NULL,
        Category         NVARCHAR(500) NOT NULL,
        Title            NVARCHAR(500) NOT NULL,
        SelectedOption   NVARCHAR(2000) NOT NULL,
        Rationale        NVARCHAR(MAX) NOT NULL,
        RawDecisionJson  NVARCHAR(MAX) NULL,
        CONSTRAINT PK_GoldenManifestDecisions PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT UQ_GoldenManifestDecisions_DecisionId UNIQUE (ManifestId, DecisionId),
        CONSTRAINT FK_GoldenManifestDecisions_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisions_ManifestId
        ON dbo.GoldenManifestDecisions (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisionEvidenceLinks
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        DecisionId   NVARCHAR(200) NOT NULL,
        SortOrder    INT NOT NULL,
        FindingId    NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestDecisionEvidenceLinks PRIMARY KEY (ManifestId, DecisionId, SortOrder),
        CONSTRAINT FK_GoldenManifestDecisionEvidenceLinks_Decisions FOREIGN KEY (ManifestId, DecisionId)
            REFERENCES dbo.GoldenManifestDecisions (ManifestId, DecisionId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisionEvidenceLinks_Manifest
        ON dbo.GoldenManifestDecisionEvidenceLinks (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestDecisionNodeLinks
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        DecisionId   NVARCHAR(200) NOT NULL,
        SortOrder    INT NOT NULL,
        NodeId       NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_GoldenManifestDecisionNodeLinks PRIMARY KEY (ManifestId, DecisionId, SortOrder),
        CONSTRAINT FK_GoldenManifestDecisionNodeLinks_Decisions FOREIGN KEY (ManifestId, DecisionId)
            REFERENCES dbo.GoldenManifestDecisions (ManifestId, DecisionId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestDecisionNodeLinks_Manifest
        ON dbo.GoldenManifestDecisionNodeLinks (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceSourceFindings
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        FindingId    NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceSourceFindings PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceSourceFindings_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceSourceFindings_Manifest
        ON dbo.GoldenManifestProvenanceSourceFindings (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceSourceGraphNodes
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        NodeId       NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceSourceGraphNodes PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceSourceGraphNodes_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceSourceGraphNodes_Manifest
        ON dbo.GoldenManifestProvenanceSourceGraphNodes (ManifestId);
END;

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GoldenManifestProvenanceAppliedRules
    (
        ManifestId   UNIQUEIDENTIFIER NOT NULL,
        SortOrder    INT NOT NULL,
        RuleId       NVARCHAR(200) NOT NULL,
        CONSTRAINT PK_GoldenManifestProvenanceAppliedRules PRIMARY KEY (ManifestId, SortOrder),
        CONSTRAINT FK_GoldenManifestProvenanceAppliedRules_GoldenManifests FOREIGN KEY (ManifestId)
            REFERENCES dbo.GoldenManifests (ManifestId) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_GoldenManifestProvenanceAppliedRules_Manifest
        ON dbo.GoldenManifestProvenanceAppliedRules (ManifestId);
END;
