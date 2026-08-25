using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopArchitectureReasoningOrchestratorTests
{
    [Fact]
    public void Constructor_does_not_inject_unused_sync_specialist_review_service()
    {
        Type[] parameterTypes = typeof(ClosedLoopArchitectureReasoningOrchestrator)
            .GetConstructors()
            .Single()
            .GetParameters()
            .Select(parameter => parameter.ParameterType)
            .ToArray();

        parameterTypes.Should().NotContain(typeof(ISpecialistReviewService));
        parameterTypes.Should().Contain(typeof(IAsyncSpecialistReviewService));
        parameterTypes.Should().Contain(typeof(ClosedLoopArchitectureReasoningPostStageHooks));
        parameterTypes.Should().NotContain(typeof(IArchitectureIntelligenceProductPublishService));
        parameterTypes.Should().NotContain(typeof(ISpecialistFindingsSubstantiationService));
        parameterTypes.Should().NotContain(typeof(IAuthorityFindingsSnapshotUpdater));
    }

    [Fact]
    public async Task RunAsync_processes_incomplete_architecture_text_end_to_end()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
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
        result.MustNotFailViolations.Should().NotBeNull();
        result.IntegrityPassedFindingIds.Should().NotBeNull();
        result.Adversarial.Should().NotBeNull();
        result.ModelDiffs.Should().NotBeNull();

        if (result.Interview.IsFramingComplete)
        {
            result.Recommendations.Should().NotBeEmpty();
        }
        else
        {
            result.Recommendations.Should().BeEmpty();
            result.ReviewCompleteBlocked.Should().BeTrue();
        }

        // Product findings are gated: only integrity-passed, non-blocked findings are published.
        foreach (var productFinding in result.ProductFindings)
        {
            result.IntegrityPassedFindingIds.Should().Contain(productFinding.FindingId);
        }
    }

    [Fact]
    public async Task RunAsync_does_not_inject_fallback_evidence_for_uncited_findings()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-gate",
            RunId = "run-gate",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "empty-ish.md",
                    ContentType = "text/markdown",
                    Content = "A vague architecture note with no concrete controls.",
                },
            ],
        };

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(request);

        result.ValidationResults.Should().NotBeEmpty();
        result.ValidationResults.Should().OnlyContain(validation =>
            validation.StageResults.Any(stage =>
                stage.Stage == EvidenceValidationStage.DeterministicIntegrity
                && stage.IsDeterministic));
    }

    [Fact]
    public async Task RunAsync_marks_provisional_synthesis_and_holds_fail_until_framing_complete()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-provisional",
            RunId = "run-provisional",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "vague.md",
                    ContentType = "text/markdown",
                    Content = "Public API exposes customer records without authentication.",
                },
            ],
        };

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(request);

        result.Interview.IsFramingComplete.Should().BeFalse();
        result.Model.IsProvisionalSynthesis.Should().BeTrue();
        result.SpecialistReviews
            .SelectMany(review => review.Findings)
            .Should()
            .NotContain(finding => finding.Conclusion == ReviewConclusion.Fail);
    }

    [Fact]
    public async Task RunAsync_does_not_mutate_inbound_request_identity_fields()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-immutable",
            RunId = string.Empty,
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = "Public API exposes customer records without authentication.",
                },
            ],
        };

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(request);

        request.TenantId.Should().Be("tenant-immutable");
        request.RunId.Should().BeEmpty();
        result.RunId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task RunAsync_does_not_persist_recommendation_apply_when_publish_blocked()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        services.RemoveAll<ITrustPublishGate>();
        services.AddSingleton<ITrustPublishGate, AlwaysBlockedTrustPublishGate>();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();
        IArchitectureIntelligencePersistence persistence =
            provider.GetRequiredService<IArchitectureIntelligencePersistence>();

        string runId = Guid.NewGuid().ToString("N");
        ClosedLoopReasoningResult result = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-blocked-save",
            RunId = runId,
            DeclaredPriorities = ["Security"],
            FramingAnswers = CreateCompleteFramingAnswers(),
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = """
                        Public API exposes customer records without authentication.
                        Billing worker is an unowned component.
                        """,
                },
            ],
        });

        result.PublishBlocked.Should().BeTrue();
        result.Recommendations.Should().BeEmpty();
        result.ImpactResults.Should().BeEmpty();
        result.ModelDiffs.Should().BeEmpty();
        result.ReReview.Should().BeNull();
        result.Model.Elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.Recommendation);

        ArchitectureKnowledgeModel? persisted = await persistence.GetModelByRunIdAsync(
            "tenant-blocked-save",
            runId,
            CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.Elements.Should().NotContain(element =>
            element.Kind == ArchitectureElementKind.Recommendation);
    }

    [Fact]
    public async Task RunAsync_skips_authority_merge_when_publish_to_product_is_false()
    {
        Mock<IAuthorityFindingsSnapshotUpdater> authorityUpdater = new();

        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        services.AddSingleton(authorityUpdater.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        string runId = Guid.NewGuid().ToString("N");
        await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-no-authority-merge",
            RunId = runId,
            PublishToProduct = false,
            DeclaredPriorities = ["Security"],
            FramingAnswers = CreateCompleteFramingAnswers(),
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = """
                        Public API exposes customer records without authentication.
                        Billing worker is an unowned component.
                        """,
                },
            ],
        });

        authorityUpdater.Verify(
            updater => updater.MergeSubstantiatedFindingsAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<SpecialistFindingsSubstantiationResult>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RunAsync_persistence_only_save_stores_clone_isolated_from_returned_model()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();
        IArchitectureIntelligencePersistence persistence =
            provider.GetRequiredService<IArchitectureIntelligencePersistence>();

        string runId = Guid.NewGuid().ToString("N");
        ClosedLoopReasoningResult result = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-persist-clone",
            RunId = runId,
            DeclaredPriorities = ["Security"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = "Public API exposes customer records without authentication.",
                },
            ],
        });

        result.Model.Elements.Should().NotBeEmpty();
        string originalName = result.Model.Elements[0].Name;
        result.Model.Elements[0].Name = "mutated-after-run";

        ArchitectureKnowledgeModel? persisted = await persistence.GetModelByRunIdAsync(
            "tenant-persist-clone",
            runId,
            CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.Elements[0].Name.Should().Be(originalName);
    }

    private static Dictionary<string, string> CreateCompleteFramingAnswers()
    {
        return new Dictionary<string, string>
        {
            ["business-outcome"] = "Secure customer onboarding",
            ["system-boundary"] = "Public API and billing worker",
            ["fixed-decisions"] = "Azure is the cloud provider",
            ["critical-quality-attributes"] = "Security and reliability",
            ["unacceptable-failures"] = "Data breach",
            ["architecture-kind"] = "Greenfield integration",
        };
    }
}
