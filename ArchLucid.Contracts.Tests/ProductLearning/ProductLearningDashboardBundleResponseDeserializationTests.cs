using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningDashboardBundleResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_bundle_slices_yields_non_null_defaults()
    {
        const string json = """
            {
              "summary": null,
              "opportunities": null,
              "trends": null,
              "triage": null
            }
            """;

        ProductLearningDashboardBundleResponse? bundle =
            JsonSerializer.Deserialize<ProductLearningDashboardBundleResponse>(json, ContractJson.CamelCaseCompact);

        bundle.Should().NotBeNull();
        bundle!.Summary.Should().NotBeNull();
        bundle.Opportunities.Should().NotBeNull();
        bundle.Trends.Should().NotBeNull();
        bundle.Triage.Should().NotBeNull();
    }
}
