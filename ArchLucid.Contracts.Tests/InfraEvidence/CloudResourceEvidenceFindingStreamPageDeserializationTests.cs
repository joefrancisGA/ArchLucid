using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class CloudResourceEvidenceFindingStreamPageDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        CloudResourceEvidenceFindingStreamPage? page =
            JsonSerializer.Deserialize<CloudResourceEvidenceFindingStreamPage>(json, ContractJson.CamelCaseCompact);

        page.Should().NotBeNull();
        page!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
