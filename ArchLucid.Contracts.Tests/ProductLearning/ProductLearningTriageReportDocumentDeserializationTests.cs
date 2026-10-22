using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ProductLearning;

[Trait("Category", "Unit")]
public sealed class ProductLearningTriageReportDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "artifactOutcomes": null,
              "topProblemAreas": null,
              "topImprovements": null,
              "triageQueuePreview": null
            }
            """;

        ProductLearningTriageReportDocument? result =
            JsonSerializer.Deserialize<ProductLearningTriageReportDocument>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ArtifactOutcomes.Should().NotBeNull().And.BeEmpty();
        result.TopProblemAreas.Should().NotBeNull().And.BeEmpty();
        result.TopImprovements.Should().NotBeNull().And.BeEmpty();
        result.TriageQueuePreview.Should().NotBeNull().And.BeEmpty();
    }
}
