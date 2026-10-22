using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class ItsmIntegrationHealthStatusResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_provider_probes_yields_non_null_defaults()
    {
        const string json = """
            {
              "jira": null,
              "serviceNow": null
            }
            """;

        ItsmIntegrationHealthStatusResponse? response =
            JsonSerializer.Deserialize<ItsmIntegrationHealthStatusResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Jira.Should().NotBeNull();
        response.ServiceNow.Should().NotBeNull();
    }
}
