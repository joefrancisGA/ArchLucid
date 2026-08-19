namespace ArchLucid.Contracts.Integrations;

/// <summary>List wrapper for tenant ITSM connector rows.</summary>
public sealed class TenantItsmConnectorConnectionsListResponse
{
    public required IReadOnlyList<TenantItsmConnectorConnectionResponse> Connections
    {
        get;
        init;
    }
}
