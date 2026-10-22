using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class TopologyCoverageFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_category_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "topologyNodeCount": 3,
              "presentCategories": null,
              "missingCategories": null,
              "expectedCategories": null
            }
            """;

        TopologyCoverageFindingPayload? payload =
            JsonSerializer.Deserialize<TopologyCoverageFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.PresentCategories.Should().NotBeNull().And.BeEmpty();
        payload.MissingCategories.Should().NotBeNull().And.BeEmpty();
        payload.ExpectedCategories.Should().NotBeNull().And.BeEmpty();
    }
}
