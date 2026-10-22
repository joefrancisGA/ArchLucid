/*
  355: Security crosswalk mappings (CW-01).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityCrosswalkMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityCrosswalkMappings
    (
        MappingId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityCrosswalkMappings PRIMARY KEY CLUSTERED,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        SourceEndpointKind  INT               NOT NULL,
        SourceEndpointId    NVARCHAR(512)     NOT NULL,
        TargetEndpointKind  INT               NOT NULL,
        TargetEndpointId    NVARCHAR(512)     NOT NULL,
        MappingType         INT               NOT NULL,
        Confidence          DECIMAL(5, 4)     NOT NULL,
        MappingSource       INT               NOT NULL,
        Version             NVARCHAR(128)     NOT NULL,
        Rationale           NVARCHAR(2000)    NOT NULL,
        HumanVerified       BIT               NOT NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        UpdatedUtc          DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_SecurityCrosswalkMappings_Tenant_Source
        ON dbo.SecurityCrosswalkMappings (TenantId, SourceEndpointKind, SourceEndpointId);

    CREATE NONCLUSTERED INDEX IX_SecurityCrosswalkMappings_Tenant_Target
        ON dbo.SecurityCrosswalkMappings (TenantId, TargetEndpointKind, TargetEndpointId);
END;
GO
