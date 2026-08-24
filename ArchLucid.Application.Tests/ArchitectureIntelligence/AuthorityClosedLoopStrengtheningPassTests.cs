using ArchLucid.Application.ArchitectureIntelligence;
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

        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(static m => m.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions { StrengthenDefaultPackage = false });

        AuthorityClosedLoopStrengtheningPass sut = new(
            orchestrator.Object,
            options.Object,
            NullLogger<AuthorityClosedLoopStrengtheningPass>.Instance);

        await sut.TryStrengthenManifestAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new RunRecord { RunId = Guid.NewGuid(), ProjectId = "GoldenCohort_test" },
            new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "GoldenCohort_test" },
            new ManifestDocument(),
            CancellationToken.None);

        orchestrator.Verify(
            static o => o.RunAsync(It.IsAny<Contracts.ArchitectureIntelligence.ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryStrengthenManifestAsync_runs_for_non_golden_cohort_when_strengthen_all_enabled()
    {
        Mock<IClosedLoopArchitectureReasoningOrchestrator> orchestrator = new();
        orchestrator
            .Setup(static o => o.RunAsync(It.IsAny<Contracts.ArchitectureIntelligence.ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Contracts.ArchitectureIntelligence.ClosedLoopReasoningResult());

        Mock<IOptionsMonitor<ArchitectureIntelligencePipelineOptions>> options = new();
        options.SetupGet(static m => m.CurrentValue)
            .Returns(new ArchitectureIntelligencePipelineOptions
            {
                StrengthenDefaultPackage = true,
                StrengthenAllReviewPackages = true,
            });

        AuthorityClosedLoopStrengtheningPass sut = new(
            orchestrator.Object,
            options.Object,
            NullLogger<AuthorityClosedLoopStrengtheningPass>.Instance);

        await sut.TryStrengthenManifestAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            new RunRecord { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "CustomerPayments" },
            new ManifestDocument(),
            CancellationToken.None);

        orchestrator.Verify(
            static o => o.RunAsync(It.IsAny<Contracts.ArchitectureIntelligence.ClosedLoopReasoningRequest>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
