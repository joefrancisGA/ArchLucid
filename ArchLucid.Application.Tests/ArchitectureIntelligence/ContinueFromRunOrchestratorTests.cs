using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ContinueFromRunOrchestratorTests
{
    [Fact]
    public async Task RunAsync_continue_reuses_persisted_model_for_runId()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningResult first = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = "Public API without authentication. Billing worker is unowned.",
                },
            ],
            DeclaredPriorities = ["Security"],
        });

        first.RunId.Should().NotBeNullOrWhiteSpace();
        first.ModelId.Should().NotBeNullOrWhiteSpace();

        ClosedLoopReasoningResult continued = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue",
            RunId = first.RunId,
            ContinueFromExistingRun = true,
            FramingAnswers = new Dictionary<string, string>
            {
                ["business-outcome"] = "Secure claims intake",
            },
            DeclaredPriorities = ["Security"],
        });

        continued.RunId.Should().Be(first.RunId);
        continued.Model.ModelId.Should().Be(first.Model.ModelId);
        continued.Model.FramingAnswers.Should().ContainKey("business-outcome");
        continued.Model.Elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Evidence
            && element.Provenance.Origin == ClaimOrigin.UserAsserted);
    }
}
