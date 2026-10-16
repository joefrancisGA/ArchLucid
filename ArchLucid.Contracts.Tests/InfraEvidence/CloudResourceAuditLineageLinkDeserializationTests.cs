using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class CloudResourceAuditLineageLinkDeserializationTests
{
    [Fact]
    public void Deserialize_null_matches_yields_empty_list_not_null()
    {
        const string json = """
            {
              "matches": null
            }
            """;

        CloudResourceAuditLineageLink? link =
            JsonSerializer.Deserialize<CloudResourceAuditLineageLink>(json, ContractJson.CamelCaseCompact);

        link.Should().NotBeNull();
        link!.Matches.Should().NotBeNull().And.BeEmpty();
    }
}
