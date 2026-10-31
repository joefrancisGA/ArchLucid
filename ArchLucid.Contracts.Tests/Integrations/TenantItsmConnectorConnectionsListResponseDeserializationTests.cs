using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class TenantItsmConnectorConnectionsListResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_connections_yields_empty_list_not_null()
    {
        const string json = """
            {
              "connections": null
            }
            """;

        TenantItsmConnectorConnectionsListResponse? response =
            JsonSerializer.Deserialize<TenantItsmConnectorConnectionsListResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Connections.Should().NotBeNull().And.BeEmpty();
    }
}
