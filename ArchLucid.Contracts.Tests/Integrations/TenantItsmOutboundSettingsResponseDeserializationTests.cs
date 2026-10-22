using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class TenantItsmOutboundSettingsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_deployment_credentials_yields_non_null_summary_not_null()
    {
        const string json = """
            {
              "tenantId": "00000000-0000-0000-0000-000000000001",
              "deploymentCredentials": null
            }
            """;

        TenantItsmOutboundSettingsResponse? response =
            JsonSerializer.Deserialize<TenantItsmOutboundSettingsResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.DeploymentCredentials.Should().NotBeNull();
    }
}
