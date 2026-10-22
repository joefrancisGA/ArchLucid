using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class RunFindingCoverageSummaryDeserializationTests
{
    [Fact]
    public void Deserialize_null_failed_engine_labels_yields_empty_list_not_null()
    {
        const string json = """
            {
              "enginesAttempted": 0,
              "enginesSucceeded": 0,
              "enginesFailed": 0,
              "isDegraded": false,
              "hasCommitBlockingFailures": false,
              "failedEngineLabels": null,
              "generationStatus": 0
            }
            """;

        RunFindingCoverageSummary? summary =
            JsonSerializer.Deserialize<RunFindingCoverageSummary>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.FailedEngineLabels.Should().NotBeNull().And.BeEmpty();
    }
}
