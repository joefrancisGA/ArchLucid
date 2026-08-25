using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;

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

    [Fact]
    public async Task RunAsync_continue_clones_loaded_model_before_mutation()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        ArchitectureKnowledgeModel persisted = new()
        {
            ModelId = "persisted-model",
            TenantId = "tenant-continue-clone",
            RunId = runId.ToString("N"),
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
        };

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(access => access.GetForRunAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(persisted);
        knowledgeModelAccess
            .Setup(access => access.SaveForRunAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                runId,
                It.IsAny<ArchitectureKnowledgeModel>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ArchLucid.Core.Scoping.IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(new ArchLucid.Core.Scoping.ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        services.AddSingleton(knowledgeModelAccess.Object);
        services.AddSingleton(scopeProvider.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        int persistedElementCount = persisted.Elements.Count;

        await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue-clone",
            RunId = runId.ToString("N"),
            ContinueFromExistingRun = true,
            FramingAnswers = new Dictionary<string, string>
            {
                ["business-outcome"] = "Secure claims intake",
            },
            DeclaredPriorities = ["Security"],
        });

        persisted.Elements.Count.Should().Be(persistedElementCount);
    }

    [Fact]
    public async Task RunAsync_continue_appends_new_source_texts_to_existing_model()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningResult first = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue-sources",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = "Public API without authentication.",
                },
            ],
            DeclaredPriorities = ["Security"],
        });

        int elementCountBeforeContinue = first.Model.Elements.Count;

        ClosedLoopReasoningResult continued = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-continue-sources",
            RunId = first.RunId,
            ContinueFromExistingRun = true,
            FramingAnswers = new Dictionary<string, string>
            {
                ["business-outcome"] = "Secure claims intake",
            },
            DeclaredPriorities = ["Security"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "billing.md",
                    ContentType = "text/markdown",
                    Content = "Billing worker is unowned and processes PCI cardholder data.",
                },
            ],
        });

        continued.Model.Elements.Count.Should().BeGreaterThan(elementCountBeforeContinue);
    }
}
