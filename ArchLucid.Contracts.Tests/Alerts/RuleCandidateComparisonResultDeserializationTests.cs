using System.Text.Json;

using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class RuleCandidateComparisonResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_summary_notes_yields_empty_list_not_null()
    {
        const string json = """
            {
              "summaryNotes": null
            }
            """;

        RuleCandidateComparisonResult? result =
            JsonSerializer.Deserialize<RuleCandidateComparisonResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SummaryNotes.Should().NotBeNull().And.BeEmpty();
    }
}
