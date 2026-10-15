using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Trust;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Trust;

[Trait("Category", "Unit")]
public sealed class RunTrustEvidenceCardDeserializationTests
{
    [Fact]
    public void Deserialize_null_links_yields_empty_list_not_null()
    {
        const string json = """
            {
              "links": null
            }
            """;

        RunTrustEvidenceCard? card =
            JsonSerializer.Deserialize<RunTrustEvidenceCard>(json, ContractJson.CamelCaseCompact);

        card.Should().NotBeNull();
        card!.Links.Should().NotBeNull().And.BeEmpty();
    }
}
