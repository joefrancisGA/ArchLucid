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

    [Theory]
    [InlineData("unknown")]
    [InlineData("2147483647")]
    public void MapEntry_rejects_corrupt_security_and_capability_state(string raw)
    {
        Action capability = () => AgentModelCatalogRepositoryCore.MapEntry(
            new() { StructuredOutputLevel = raw }, []);
        Action boundary = () => AgentModelCatalogRepositoryCore.MapEntry(
            new() { DataBoundary = raw }, []);
        Action lifecycle = () => AgentModelCatalogRepositoryCore.MapEntry(
            new() { LifecycleStatus = raw }, []);

        capability.Should().Throw<ArgumentException>();
        boundary.Should().Throw<ArgumentException>();
        lifecycle.Should().Throw<ArgumentException>();
    }
}
