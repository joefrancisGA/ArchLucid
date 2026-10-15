using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceDeepCaseDeserializationTests
{
    [Fact]
    public void Deserialize_null_planted_defect_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "caseId": "case-1",
              "title": "t",
              "sourceText": "s",
              "plantedDefects": null,
              "expectedMutationIds": null
            }
            """;

        ArchitectureIntelligenceDeepCase? deepCase =
            JsonSerializer.Deserialize<ArchitectureIntelligenceDeepCase>(json, ContractJson.CamelCaseCompact);

        deepCase.Should().NotBeNull();
        deepCase!.PlantedDefects.Should().NotBeNull().And.BeEmpty();
        deepCase.ExpectedMutationIds.Should().NotBeNull().And.BeEmpty();
    }
}
