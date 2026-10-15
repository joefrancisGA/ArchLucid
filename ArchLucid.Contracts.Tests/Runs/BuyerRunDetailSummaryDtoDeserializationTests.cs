using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class BuyerRunDetailSummaryDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_summary_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "run": {
                "runId": "00000000-0000-0000-0000-000000000001",
                "scopeProjectId": "00000000-0000-0000-0000-000000000002",
                "projectId": "p"
              },
              "degradedExecutionAgents": null,
              "findingSummaries": null,
              "agentExecutionOutcomes": null
            }
            """;

        BuyerRunDetailSummaryDto? summary =
            JsonSerializer.Deserialize<BuyerRunDetailSummaryDto>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.DegradedExecutionAgents.Should().NotBeNull().And.BeEmpty();
        summary.FindingSummaries.Should().NotBeNull().And.BeEmpty();
        summary.AgentExecutionOutcomes.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_optional_nested_summaries_remain_null()
    {
        const string json = """
            {
              "run": {
                "runId": "00000000-0000-0000-0000-000000000001",
                "scopeProjectId": "00000000-0000-0000-0000-000000000002",
                "projectId": "p"
              },
              "findingCoverageSummary": null,
              "agentExecutionLlmCostEstimate": null,
              "trustEvidenceCard": null
            }
            """;

        BuyerRunDetailSummaryDto? summary =
            JsonSerializer.Deserialize<BuyerRunDetailSummaryDto>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.FindingCoverageSummary.Should().BeNull();
        summary.AgentExecutionLlmCostEstimate.Should().BeNull();
        summary.TrustEvidenceCard.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_remaining_optional_nested_summaries_remain_null()
    {
        const string json = """
            {
              "run": {
                "runId": "00000000-0000-0000-0000-000000000001",
                "scopeProjectId": "00000000-0000-0000-0000-000000000002",
                "projectId": "p"
              },
              "retrievalGroundingSummary": null,
              "lastAgentExecutionFailure": null,
              "estimatedUsdSavingsSummary": null,
              "decisionExplainability": null
            }
            """;

        BuyerRunDetailSummaryDto? summary =
            JsonSerializer.Deserialize<BuyerRunDetailSummaryDto>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.RetrievalGroundingSummary.Should().BeNull();
        summary.LastAgentExecutionFailure.Should().BeNull();
        summary.EstimatedUsdSavingsSummary.Should().BeNull();
        summary.DecisionExplainability.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_run_yields_non_null_run_not_null()
    {
        const string json = """
            {
              "run": null
            }
            """;

        BuyerRunDetailSummaryDto? summary =
            JsonSerializer.Deserialize<BuyerRunDetailSummaryDto>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.Run.Should().NotBeNull();
    }
}
