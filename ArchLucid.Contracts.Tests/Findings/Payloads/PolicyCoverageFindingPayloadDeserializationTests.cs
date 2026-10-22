using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings.Payloads;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings.Payloads;

[Trait("Category", "Unit")]
public sealed class PolicyCoverageFindingPayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_uncovered_resources_yields_empty_list_not_null()
    {
        const string json = """
            {
              "policyNodeCount": 0,
              "policyApplicabilityEdgeCount": 0,
              "uncoveredResources": null
            }
            """;

        PolicyCoverageFindingPayload? payload =
            JsonSerializer.Deserialize<PolicyCoverageFindingPayload>(json, ContractJson.CamelCaseCompact);

        payload.Should().NotBeNull();
        payload!.UncoveredResources.Should().NotBeNull().And.BeEmpty();
    }
}
