using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class RewriteArchitectureOverviewInputDeserializationTests
{
    [Fact]
    public void Deserialize_null_structured_brief_yields_non_null_brief_not_null()
    {
        const string json = """
            {
              "currentOverview": "abcdefghijklmnopqrst",
              "structuredBrief": null
            }
            """;

        RewriteArchitectureOverviewInput? input =
            JsonSerializer.Deserialize<RewriteArchitectureOverviewInput>(json, ContractJson.CamelCaseCompact);

        input.Should().NotBeNull();
        input!.StructuredBrief.Should().NotBeNull();
    }
}
