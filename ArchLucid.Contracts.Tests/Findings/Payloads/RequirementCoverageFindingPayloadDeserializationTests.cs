using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class RequirementCoverageFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_uncovered_requirements_yields_empty_list_not_null()
    {
        const string json = """
            {
              "requirementNodeCount": 0,
              "coveredRequirementCount": 0,
              "uncoveredRequirementCount": 0,
              "uncoveredRequirements": null
            }
            """;

        RequirementCoverageFindingPayload? payload =
            JsonSerializer.Deserialize<RequirementCoverageFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.UncoveredRequirements.Should().NotBeNull().And.BeEmpty();
    }
}
