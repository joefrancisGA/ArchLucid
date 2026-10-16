using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class RequirementExpectationFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_theme_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "requirementNodeCount": 0,
              "topologyNodeCount": 0,
              "expectedThemes": null,
              "presentThemes": null,
              "missingThemes": null
            }
            """;

        RequirementExpectationFindingPayload? payload =
            JsonSerializer.Deserialize<RequirementExpectationFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.ExpectedThemes.Should().NotBeNull().And.BeEmpty();
        payload.PresentThemes.Should().NotBeNull().And.BeEmpty();
        payload.MissingThemes.Should().NotBeNull().And.BeEmpty();
    }
}
