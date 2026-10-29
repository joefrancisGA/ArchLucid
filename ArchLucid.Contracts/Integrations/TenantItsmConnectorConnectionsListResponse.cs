using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Integrations;

/// <summary>List wrapper for tenant ITSM connector rows.</summary>
public sealed class TenantItsmConnectorConnectionsListResponse
{
    private IReadOnlyList<TenantItsmConnectorConnectionResponse> connections = [];

    public required IReadOnlyList<TenantItsmConnectorConnectionResponse> Connections
    {
        get => connections;
        init => connections = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
