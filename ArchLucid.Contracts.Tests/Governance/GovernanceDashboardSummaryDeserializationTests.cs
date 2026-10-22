using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceDashboardSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "pendingApprovals": null,
              "recentDecisions": null,
              "recentChanges": null,
              "pendingCount": 0,
              "totalPromptTokens": 0,
              "totalCompletionTokens": 0
            }
            """;

        GovernanceDashboardSummary summary =
            JsonSerializer.Deserialize<GovernanceDashboardSummary>(json, ContractJson.Default)!;

        summary.PendingApprovals.Should().NotBeNull().And.BeEmpty();
        summary.RecentDecisions.Should().NotBeNull().And.BeEmpty();
        summary.RecentChanges.Should().NotBeNull().And.BeEmpty();
    }
}
