using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ReviewRunEngineSelectionProvenanceBuilderTests
{
    [Fact]
    public void Build_skips_null_task_evaluation_entries()
    {
        DateTime runCreated = new(2026, 10, 26, 12, 0, 0, DateTimeKind.Utc);

        AgentModelAliasRegistryEntry entry = new()
        {
            AliasId = "alias-review",
            ProviderConnectionKind = "azure-openai",
            DeploymentName = "gpt-test",
            CapabilityTags = ["chat"],
            ApprovedTaskTypes = ["topology"],
            TaskEvaluations =
            [
                null!,
                new AgentModelCatalogEvaluationRow
                {
                    TaskType = "topology",
                    EvaluationState = AgentModelEvaluationStateKind.Evaluated,
                    EvaluatedUtc = runCreated,
                },
            ],
        };

        ReviewRunEngineProvenance provenance = ReviewRunEngineSelectionProvenanceBuilder.Build(
            "alias-review",
            entry,
            runCreated);

        provenance.TaskEvaluationSnapshotsAtSelection.Should().ContainSingle();
        provenance.TaskEvaluationSnapshotsAtSelection[0].TaskType.Should().Be("topology");
    }
}
