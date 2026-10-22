using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class EvidenceValidationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_stage_results_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingId": "finding-1",
              "stageResults": null,
              "overallPassedIntegrity": true
            }
            """;

        EvidenceValidationResult? result =
            JsonSerializer.Deserialize<EvidenceValidationResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.StageResults.Should().NotBeNull().And.BeEmpty();
    }
}
