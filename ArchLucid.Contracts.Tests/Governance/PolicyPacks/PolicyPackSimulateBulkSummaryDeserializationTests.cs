using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class PolicyPackSimulateBulkSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_results_yields_empty_list_not_null()
    {
        const string json = """
            {
              "policyPackId": "00000000-0000-0000-0000-000000000001",
              "policyPackVersion": "1.0.0",
              "requestedRunCount": 0,
              "evaluatedRunCount": 0,
              "notFoundRunCount": 0,
              "wouldBlockCommitCount": 0,
              "results": null
            }
            """;

        PolicyPackSimulateBulkSummary summary =
            JsonSerializer.Deserialize<PolicyPackSimulateBulkSummary>(json, ContractJson.CamelCaseCompact)!;

        summary.Results.Should().NotBeNull().And.BeEmpty();
    }
}
