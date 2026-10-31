using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class PromptVariantStatsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_variants_yields_empty_list_not_null()
    {
        const string json = """
            {
              "promptTemplateName": "review-summary",
              "variants": null
            }
            """;

        PromptVariantStatsResponse? response =
            JsonSerializer.Deserialize<PromptVariantStatsResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Variants.Should().NotBeNull().And.BeEmpty();
    }
}
