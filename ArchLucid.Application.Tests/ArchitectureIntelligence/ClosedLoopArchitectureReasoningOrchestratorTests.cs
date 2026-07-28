using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopArchitectureReasoningOrchestratorTests
{
    [Fact]
    public async Task RunAsync_processes_incomplete_architecture_text_end_to_end()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-1",
            RunId = "run-1",
            DeclaredPriorities = ["Security"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = """
                        Public API exposes customer records without authentication.
                        The billing worker is an unowned component.
                        """,
                },
            ],
        };

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(request);

        result.Model.Elements.Should().NotBeEmpty();
        result.SpecialistReviews.Should().NotBeEmpty();
        result.ValidationResults.Should().NotBeEmpty();
        result.Recommendations.Should().NotBeEmpty();
        result.MustNotFailViolations.Should().NotBeNull();
    }
}
