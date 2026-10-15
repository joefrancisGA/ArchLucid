using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminDeploymentStatusResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_links_yields_empty_list_not_null()
    {
        const string json = """
            {
              "links": null
            }
            """;

        AdminDeploymentStatusResponse? result =
            JsonSerializer.Deserialize<AdminDeploymentStatusResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Links.Should().NotBeNull().And.BeEmpty();
    }
}
