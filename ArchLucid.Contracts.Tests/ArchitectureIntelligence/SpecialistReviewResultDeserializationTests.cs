using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SpecialistReviewResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "dimension": 0,
              "findings": null,
              "openQuestions": null
            }
            """;

        SpecialistReviewResult? result =
            JsonSerializer.Deserialize<SpecialistReviewResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Findings.Should().NotBeNull().And.BeEmpty();
        result.OpenQuestions.Should().NotBeNull().And.BeEmpty();
    }
}
