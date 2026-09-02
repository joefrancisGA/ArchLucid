using ArchLucid.Core.Agents;
using ArchLucid.Persistence.Agents;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentModelCatalogRepositoryCoreTests
{
    [Fact]
    public void Clone_copies_evaluations()
    {
        AgentModelCatalogRow source = new()
        {
            AliasId = "alias-1",
            ProviderConnectionKind = "azure-openai",
            CapabilityTags = [],
            ApprovedTaskTypes = [],
            Evaluations =
            [
                new AgentModelCatalogEvaluationRow
                {
                    TaskType = "summarize",
                    EvaluationState = AgentModelEvaluationStateKind.Evaluated,
                },
            ],
        };

        AgentModelCatalogRow clone = AgentModelCatalogRepositoryCore.Clone(source);
        clone.Evaluations.Should().ContainSingle();
        clone.Evaluations[0].TaskType.Should().Be("summarize");
    }
}
