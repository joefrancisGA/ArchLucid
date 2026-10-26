using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ReviewRunEngineProvenanceMergerTests
{
    [Fact]
    public void MergeSelectionWithExecution_PreservesSelectionAliasAndEvalSnapshots()
    {
        ReviewRunEngineProvenance selection = new()
        {
            ModelAliasId = "premium-assurance",
            TaskEvaluationSnapshotsAtSelection =
            [
                new ReviewRunEngineTaskEvaluationSnapshot
                {
                    TaskType = "Topology",
                    EvaluationState = "NotEvaluated"
                }
            ],
            RunTimestampUtc = new DateTime(2026, 8, 13, 12, 0, 0, DateTimeKind.Utc)
        };

        ReviewRunEngineProvenance execution = new()
        {
            ProviderKind = "azure-openai",
            DeploymentOrModelId = "gpt-4o",
            RunTimestampUtc = new DateTime(2026, 8, 13, 12, 5, 0, DateTimeKind.Utc)
        };

        ReviewRunEngineProvenance merged =
            ReviewRunEngineProvenanceMerger.MergeSelectionWithExecution(selection, execution);

        merged.ModelAliasId.Should().Be("premium-assurance");
        merged.TaskEvaluationSnapshotsAtSelection.Should().HaveCount(1);
        merged.ProviderKind.Should().Be("azure-openai");
        merged.DeploymentOrModelId.Should().Be("gpt-4o");
    }

    [Fact]
    public void MergeSelectionWithExecution_skips_null_task_evaluation_snapshot_entries()
    {
        ReviewRunEngineProvenance selection = new()
        {
            ModelAliasId = "premium-assurance",
            TaskEvaluationSnapshotsAtSelection =
            [
                null!,
                new ReviewRunEngineTaskEvaluationSnapshot
                {
                    TaskType = "Topology",
                    EvaluationState = "Evaluated",
                },
            ],
        };

        ReviewRunEngineProvenance execution = new()
        {
            ProviderKind = "azure-openai",
            DeploymentOrModelId = "gpt-4o",
        };

        ReviewRunEngineProvenance merged =
            ReviewRunEngineProvenanceMerger.MergeSelectionWithExecution(selection, execution);

        merged.TaskEvaluationSnapshotsAtSelection.Should().ContainSingle();
        merged.TaskEvaluationSnapshotsAtSelection![0].TaskType.Should().Be("Topology");
    }
}
