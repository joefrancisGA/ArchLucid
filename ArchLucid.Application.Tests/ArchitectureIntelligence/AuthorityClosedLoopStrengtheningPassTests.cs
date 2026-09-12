using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class AuthorityClosedLoopStrengtheningPassTests
{
    [Fact]
    public async Task TryStrengthenManifestAsync_is_noop_when_flag_disabled()
    {
        Mock<IClosedLoopArchitectureReasoningOrchestrator> orchestrator = new();
        Mock<IArchitectureIntelligenceProductRunSourceContextLoader> sourceLoader = new();
        Mock<IClosedLoopManifestMerger> merger = new();
        Mock<IArchitectureIntelligenceProductPublishService> publishService = new();

        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(static m => m.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions { StrengthenDefaultPackage = false });

        AuthorityClosedLoopStrengtheningPass sut = CreateSut(
            orchestrator.Object,
            sourceLoader.Object,
            merger.Object,
            publishService.Object,
            options.Object);

        await sut.TryStrengthenManifestAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new RunRecord { RunId = Guid.NewGuid(), ProjectId = "GoldenCohort_test" },
            new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "GoldenCohort_test" },
            new ManifestDocument(),
            CancellationToken.None);

        orchestrator.Verify(
            static o => o.RunAsync(It.IsAny<ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
        merger.Verify(
            static m => m.MergeStrengtheningResult(
                It.IsAny<ManifestDocument>(),
                It.IsAny<ClosedLoopReasoningResult>(),
                It.IsAny<Contracts.Requests.ArchitectureRequest>()),
            Times.Never);
    }

    [Fact]
    public async Task TryStrengthenManifestAsync_runs_for_non_golden_cohort_when_strengthen_all_enabled()
    {
        Mock<IClosedLoopArchitectureReasoningOrchestrator> orchestrator = new();
        orchestrator
            .Setup(static o => o.RunAsync(It.IsAny<ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClosedLoopReasoningResult());

        Mock<IArchitectureIntelligenceProductRunSourceContextLoader> sourceLoader = new();
        sourceLoader
            .Setup(static l => l.LoadAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ArchitectureIntelligenceProductRunSourceContextLoadResult.Empty("empty"));

        Mock<IClosedLoopManifestMerger> merger = new();
        merger
            .Setup(static m => m.MergeStrengtheningResult(
                It.IsAny<ManifestDocument>(),
                It.IsAny<ClosedLoopReasoningResult>(),
                It.IsAny<Contracts.Requests.ArchitectureRequest>()))
            .Returns(new ClosedLoopManifestMergeResult());

        Mock<IArchitectureIntelligenceProductPublishService> publishService = new();

        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(static m => m.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions
            {
                StrengthenDefaultPackage = true,
                StrengthenAllReviewPackages = true,
            });

        AuthorityClosedLoopStrengtheningPass sut = CreateSut(
            orchestrator.Object,
            sourceLoader.Object,
            merger.Object,
            publishService.Object,
            options.Object);

        await sut.TryStrengthenManifestAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new RunRecord { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ManifestDocument(),
            CancellationToken.None);

        orchestrator.Verify(
            static o => o.RunAsync(
                It.Is<ClosedLoopReasoningRequest>(request => request.PublishToProduct),
                It.IsAny<CancellationToken>()),
            Times.Once);
        merger.Verify(
            static m => m.MergeStrengtheningResult(
                It.IsAny<ManifestDocument>(),
                It.IsAny<ClosedLoopReasoningResult>(),
                It.IsAny<Contracts.Requests.ArchitectureRequest>()),
            Times.Once);
    }

    [Fact]
    public async Task TryStrengthenManifestAsync_skips_non_golden_cohort_when_only_default_package_flag_enabled()
    {
        Mock<IClosedLoopArchitectureReasoningOrchestrator> orchestrator = new();
        Mock<IArchitectureIntelligenceProductRunSourceContextLoader> sourceLoader = new();
        Mock<IClosedLoopManifestMerger> merger = new();
        Mock<IArchitectureIntelligenceProductPublishService> publishService = new();

        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(static m => m.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions { StrengthenDefaultPackage = true });

        AuthorityClosedLoopStrengtheningPass sut = CreateSut(
            orchestrator.Object,
            sourceLoader.Object,
            merger.Object,
            publishService.Object,
            options.Object);

        await sut.TryStrengthenManifestAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new RunRecord { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ManifestDocument(),
            CancellationToken.None);

        orchestrator.Verify(
            static o => o.RunAsync(It.IsAny<ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static AuthorityClosedLoopStrengtheningPass CreateSut(
        IClosedLoopArchitectureReasoningOrchestrator orchestrator,
        IArchitectureIntelligenceProductRunSourceContextLoader sourceLoader,
        IClosedLoopManifestMerger merger,
        IArchitectureIntelligenceProductPublishService publishService,
        IOptionsMonitor<ArchitectureIntelligencePipelineOptions> options) =>
        new(
            orchestrator,
            sourceLoader,
            merger,
            publishService,
            architectureRequestRepository: null,
            options,
            NullLogger<AuthorityClosedLoopStrengtheningPass>.Instance);
}
