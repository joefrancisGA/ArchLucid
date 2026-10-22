namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>First-party ITSM vendors supported for per-tenant connector rows (TB-392).</summary>
public enum TenantItsmConnectorProvider
{
    Jira = 1,
    ServiceNow = 2,
    AzureBoards = 3
}
