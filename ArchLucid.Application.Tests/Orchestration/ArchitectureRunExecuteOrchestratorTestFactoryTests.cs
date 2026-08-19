using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteOrchestratorTestFactoryTests
{
    [Fact]
    public void CreateStandardTailDependencies_includes_required_logger()
    {
        ArchitectureRunExecuteOrchestratorTailDependencies tail =
            ArchitectureRunExecuteOrchestratorTestFactory.CreateStandardTailDependencies();

        tail.TopologyProposalSeeder.Should().NotBeNull();
        tail.DemoExpensiveActionGate.Should().NotBeNull();
        tail.RunScopedLlmBudgetReservationService.Should().NotBeNull();
        tail.RunStageOutcomesRepository.Should().NotBeNull();
        tail.Logger.Should().NotBeNull();
    }
}
