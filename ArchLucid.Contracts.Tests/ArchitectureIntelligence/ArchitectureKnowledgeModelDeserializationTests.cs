using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureKnowledgeModelDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_collections_not_null()
    {
        const string json = """
            {
              "modelId": "model-1",
              "tenantId": "tenant-1",
              "createdUtc": "2026-10-15T00:00:00Z",
              "updatedUtc": "2026-10-15T00:00:00Z",
              "elements": null,
              "declaredPriorities": null,
              "framingAnswers": null
            }
            """;

        ArchitectureKnowledgeModel? model =
            JsonSerializer.Deserialize<ArchitectureKnowledgeModel>(json, ContractJson.CamelCaseCompact);

        model.Should().NotBeNull();
        model!.Elements.Should().NotBeNull().And.BeEmpty();
        model.DeclaredPriorities.Should().NotBeNull().And.BeEmpty();
        model.FramingAnswers.Should().NotBeNull().And.BeEmpty();
    }
}
