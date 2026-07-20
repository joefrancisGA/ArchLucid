/*
  269: Technology Ledger — canonical per-run technology facts (additive; unwired).

  See docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md
  and docs/architecture/ARCHITECTURE_GENERATION_TECHNOLOGY_CONSISTENCY_ASSESSMENT_2026_07_07.md.

  RLS: not applied — run-child scope enforced in repository queries via ScopeContext, matching AgentExecutionTraces.
*/
IF OBJECT_ID(N'dbo.TechnologyLedgerEntries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TechnologyLedgerEntries
    (
        EntryId        NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId          UNIQUEIDENTIFIER NOT NULL,
        Role           NVARCHAR(32)     NOT NULL,
        TechnologyName NVARCHAR(200)    NOT NULL,
        ProviderFamily NVARCHAR(16)     NOT NULL,
        Status         NVARCHAR(16)     NOT NULL,
        Source         NVARCHAR(16)     NOT NULL,
        EvidenceRef    NVARCHAR(200)    NULL,
        Rationale      NVARCHAR(2000)   NULL,
        IsLocked       BIT              NOT NULL DEFAULT (0),
        CreatedUtc     DATETIME2(7)     NOT NULL,
        UpdatedUtc     DATETIME2(7)     NOT NULL,
        CONSTRAINT CK_TechnologyLedgerEntries_Role CHECK (Role IN (
            N'CloudPlatform', N'IdentityProvider', N'PrimaryDatastore', N'Messaging',
            N'ComputeRuntime', N'Region', N'IacTarget', N'Other')),
        CONSTRAINT CK_TechnologyLedgerEntries_ProviderFamily CHECK (ProviderFamily IN (
            N'None', N'Azure', N'Aws', N'Gcp')),
        CONSTRAINT CK_TechnologyLedgerEntries_Status CHECK (Status IN (
            N'Chosen', N'Assumed', N'Alternative', N'Future')),
        CONSTRAINT CK_TechnologyLedgerEntries_Source CHECK (Source IN (
            N'User', N'Evidence', N'AgentProposed')),
        INDEX IX_TechnologyLedgerEntries_RunId NONCLUSTERED (RunId),
        INDEX IX_TechnologyLedgerEntries_RunId_Role NONCLUSTERED (RunId, Role)
    );
END;
GO
