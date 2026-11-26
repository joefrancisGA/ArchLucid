/* Durable runtime attestation watermark. Tenant catalog; no automatic purge. */
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.RuntimeAttestationWatermarks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RuntimeAttestationWatermarks
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ScopeHash BINARY(32) NOT NULL,
        IssuedAt DATETIMEOFFSET(7) NOT NULL,
        EnumeratedAt DATETIMEOFFSET(7) NOT NULL,
        ExpiresAt DATETIMEOFFSET(7) NOT NULL,
        PayloadDigest BINARY(32) NOT NULL,
        CONSTRAINT PK_RuntimeAttestationWatermarks PRIMARY KEY
            (TenantId, WorkspaceId, ProjectId, ScopeHash),
        CONSTRAINT CK_RuntimeAttestationWatermarks_Times
            CHECK (EnumeratedAt <= IssuedAt AND IssuedAt < ExpiresAt)
    );
END;
GO
CREATE OR ALTER PROCEDURE dbo.TryAdvanceRuntimeAttestationWatermark
    @tenant UNIQUEIDENTIFIER, @workspace UNIQUEIDENTIFIER, @project UNIQUEIDENTIFIER,
    @scopeHash BINARY(32), @issued DATETIMEOFFSET(7), @enumerated DATETIMEOFFSET(7),
    @expires DATETIMEOFFSET(7), @digest BINARY(32)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @accepted BIT = 0;
    DECLARE @zero UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000000';
    IF @tenant IS NULL OR @workspace IS NULL OR @project IS NULL
        OR @tenant = @zero OR @workspace = @zero OR @project = @zero
        OR @scopeHash IS NULL OR @digest IS NULL OR @issued IS NULL
        OR @enumerated IS NULL OR @expires IS NULL
        OR @enumerated > @issued OR @issued >= @expires
        OR @expires > DATEADD(MINUTE, 15, @issued)
    BEGIN
        SELECT @accepted;
        RETURN;
    END;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @previousIssued DATETIMEOFFSET(7), @previousEnumerated DATETIMEOFFSET(7),
                @previousExpires DATETIMEOFFSET(7), @previousDigest BINARY(32);
        SELECT @previousIssued = IssuedAt, @previousEnumerated = EnumeratedAt,
               @previousExpires = ExpiresAt, @previousDigest = PayloadDigest
        FROM dbo.RuntimeAttestationWatermarks WITH (UPDLOCK, HOLDLOCK)
        WHERE TenantId = @tenant AND WorkspaceId = @workspace
            AND ProjectId = @project AND ScopeHash = @scopeHash;

        -- Evaluate freshness after waiting for the transaction lock.
        DECLARE @now DATETIMEOFFSET(7) = TODATETIMEOFFSET(SYSUTCDATETIME(), '+00:00');
        IF @issued <= @now AND @expires > @now
        BEGIN
            IF @previousIssued IS NULL
            BEGIN
                INSERT dbo.RuntimeAttestationWatermarks
                    (TenantId, WorkspaceId, ProjectId, ScopeHash, IssuedAt,
                     EnumeratedAt, ExpiresAt, PayloadDigest)
                VALUES (@tenant, @workspace, @project, @scopeHash, @issued,
                        @enumerated, @expires, @digest);
                SET @accepted = 1;
            END
            ELSE IF @issued > @previousIssued AND @enumerated >= @previousEnumerated
            BEGIN
                UPDATE dbo.RuntimeAttestationWatermarks
                SET IssuedAt = @issued, EnumeratedAt = @enumerated,
                    ExpiresAt = @expires, PayloadDigest = @digest
                WHERE TenantId = @tenant AND WorkspaceId = @workspace
                    AND ProjectId = @project AND ScopeHash = @scopeHash;
                SET @accepted = 1;
            END
            ELSE IF @issued = @previousIssued AND @enumerated = @previousEnumerated
                AND @expires = @previousExpires AND @digest = @previousDigest
                SET @accepted = 1;
        END;
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
    DENY INSERT, UPDATE, DELETE ON OBJECT::dbo.RuntimeAttestationWatermarks TO [ArchLucidApp];
    GRANT EXECUTE ON OBJECT::dbo.TryAdvanceRuntimeAttestationWatermark TO [ArchLucidApp];
END;
GO
