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

    [Fact]
    public void Build_handles_null_task_evaluations_list()
    {
        DateTime runCreated = new(2026, 10, 26, 12, 5, 0, DateTimeKind.Utc);

        AgentModelAliasRegistryEntry entry = new()
        {
            AliasId = "alias-null-evaluations",
            ProviderConnectionKind = "azure-openai",
            DeploymentName = "gpt-test",
            CapabilityTags = ["chat"],
            ApprovedTaskTypes = ["topology"],
            TaskEvaluations = null!,
        };

        ReviewRunEngineProvenance provenance = ReviewRunEngineSelectionProvenanceBuilder.Build(
            "alias-null-evaluations",
            entry,
            runCreated);

        provenance.TaskEvaluationSnapshotsAtSelection.Should().BeEmpty();
        provenance.ModelAliasId.Should().Be("alias-null-evaluations");
    }
}
