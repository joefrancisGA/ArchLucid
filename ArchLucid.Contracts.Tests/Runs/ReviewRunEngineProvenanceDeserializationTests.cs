using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class ReviewRunEngineProvenanceDeserializationTests
{
    [Fact]
    public void Deserialize_null_task_evaluation_snapshots_at_selection_remains_null()
    {
        const string json = """
            {
              "taskEvaluationSnapshotsAtSelection": null
            }
            """;

        ReviewRunEngineProvenance? provenance =
            JsonSerializer.Deserialize<ReviewRunEngineProvenance>(json, ContractJson.CamelCaseCompact);

        provenance.Should().NotBeNull();
        provenance!.TaskEvaluationSnapshotsAtSelection.Should().BeNull(
            "nullable property has no collection initializer; explicit null means absent snapshots");
    }
}
