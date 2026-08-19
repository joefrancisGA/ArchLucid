/*
  145: Per-tenant optional overrides for first-party outbound Jira / ServiceNow issue creation.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.TenantItsmOutboundSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantItsmOutboundSettings
    (
        TenantId                      UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantItsmOutboundSettings PRIMARY KEY CLUSTERED,
        JiraProjectKeyOverride       NVARCHAR(32)      NULL,
        JiraSendInfoSeverity          BIT               NOT NULL
            CONSTRAINT DF_TenantItsmOutboundSettings_JiraSendInfoSeverity DEFAULT (0),
        JiraIssueTypeBySeverityJson   NVARCHAR(4000)    NULL,
        ServiceNowAutoCreateCmdbCi    BIT               NOT NULL
            CONSTRAINT DF_TenantItsmOutboundSettings_ServiceNowAutoCreateCmdbCi DEFAULT (0),
        CONSTRAINT FK_TenantItsmOutboundSettings_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
