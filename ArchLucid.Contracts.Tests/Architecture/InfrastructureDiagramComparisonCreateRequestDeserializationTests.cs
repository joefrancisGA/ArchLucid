using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class InfrastructureDiagramComparisonCreateRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_sources_yields_empty_list_not_null()
    {
        Guid snapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        string json = $$"""
            {
              "snapshotId": "{{snapshotId}}",
              "sources": null
            }
            """;

        InfrastructureDiagramComparisonCreateRequest? request =
            JsonSerializer.Deserialize<InfrastructureDiagramComparisonCreateRequest>(json, ContractJson.CamelCaseCompact);

        request.Should().NotBeNull();
        request!.Sources.Should().NotBeNull();
        request.Sources.Should().BeEmpty();
    }
}
