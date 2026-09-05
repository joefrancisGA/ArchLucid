/*
  359: Operational security exceptions (IE-12).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityExceptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperationalSecurityExceptions
    (
        ExceptionId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OperationalSecurityExceptions PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        FindingId                 UNIQUEIDENTIFIER NULL,
        PatternId                 UNIQUEIDENTIFIER NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        OwnerActorKeysJson        NVARCHAR(2048)    NOT NULL,
        Rationale                 NVARCHAR(4000)    NOT NULL,
        ResidualRisk              NVARCHAR(2000)    NULL,
        CompensatingControls      NVARCHAR(4000)    NULL,
        EvidenceReference         NVARCHAR(1024)    NULL,
        ExpirationUtc             DATETIME2         NOT NULL,
        Status                    INT               NOT NULL,
        RequestedByActorKey       NVARCHAR(256)     NOT NULL,
        ApprovedByActorKey          NVARCHAR(256)     NOT NULL,
        PayloadHashSha256         VARBINARY(32)     NOT NULL,
        ExpiryProcessedUtc        DATETIME2         NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        UpdatedUtc                DATETIME2         NOT NULL,
        RevokedUtc                DATETIME2         NULL,
        RevokedByActorKey         NVARCHAR(256)     NULL,
        CONSTRAINT FK_OperationalSecurityExceptions_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId)
    );

    CREATE NONCLUSTERED INDEX IX_OperationalSecurityExceptions_Tenant_Status_Expiration
        ON dbo.OperationalSecurityExceptions (TenantId, Status, ExpirationUtc);

    CREATE NONCLUSTERED INDEX IX_OperationalSecurityExceptions_Tenant_Finding
        ON dbo.OperationalSecurityExceptions (TenantId, FindingId)
        WHERE FindingId IS NOT NULL;
END;
GO
