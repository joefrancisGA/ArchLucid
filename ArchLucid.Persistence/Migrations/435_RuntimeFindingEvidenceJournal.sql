/* Append-only runtime finding evidence journal in the tenant catalog. */
IF OBJECT_ID(N'dbo.RuntimeFindingEvidenceJournal', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RuntimeFindingEvidenceJournal
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ScopeHash BINARY(32) NOT NULL,
        PayloadHash BINARY(32) NOT NULL,
        Payload VARBINARY(MAX) NOT NULL,
        RecordedUtc DATETIME2(7) NOT NULL CONSTRAINT DF_RuntimeFindingEvidenceJournal_RecordedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_RuntimeFindingEvidenceJournal PRIMARY KEY
            (TenantId, WorkspaceId, ProjectId, ScopeHash, PayloadHash),
        CONSTRAINT CK_RuntimeFindingEvidenceJournal_Payload CHECK
            (DATALENGTH(Payload) BETWEEN 1 AND 1048576 AND PayloadHash = HASHBYTES('SHA2_256', Payload))
    );
END;
GO
CREATE OR ALTER PROCEDURE dbo.AppendRuntimeFindingEvidence
    @tenant UNIQUEIDENTIFIER, @workspace UNIQUEIDENTIFIER, @project UNIQUEIDENTIFIER,
    @scopeHash BINARY(32), @payloadHash BINARY(32), @payload VARBINARY(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @accepted BIT = 0;
    DECLARE @zero UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000000';
    IF @tenant IS NULL OR @workspace IS NULL OR @project IS NULL
        OR @tenant = @zero OR @workspace = @zero OR @project = @zero
        OR @scopeHash IS NULL OR @payloadHash IS NULL OR @payload IS NULL
        OR DATALENGTH(@payload) NOT BETWEEN 1 AND 1048576
        OR HASHBYTES('SHA2_256', @payload) <> @payloadHash
    BEGIN
        SELECT @accepted;
        RETURN;
    END;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @existing VARBINARY(MAX);
        SELECT @existing = Payload
        FROM dbo.RuntimeFindingEvidenceJournal WITH (UPDLOCK, HOLDLOCK)
        WHERE TenantId = @tenant AND WorkspaceId = @workspace AND ProjectId = @project
          AND ScopeHash = @scopeHash AND PayloadHash = @payloadHash;
        IF @existing IS NULL
        BEGIN
            INSERT dbo.RuntimeFindingEvidenceJournal
                (TenantId, WorkspaceId, ProjectId, ScopeHash, PayloadHash, Payload)
            VALUES (@tenant, @workspace, @project, @scopeHash, @payloadHash, @payload);
            SET @accepted = 1;
        END
        ELSE IF DATALENGTH(@existing) = DATALENGTH(@payload) AND @existing = @payload
            SET @accepted = 1;
        COMMIT TRANSACTION;
        SELECT @accepted;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    DENY INSERT, UPDATE, DELETE ON OBJECT::dbo.RuntimeFindingEvidenceJournal TO [ArchLucidApp];
    GRANT EXECUTE ON OBJECT::dbo.AppendRuntimeFindingEvidence TO [ArchLucidApp];
END;
GO
