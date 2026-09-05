using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunCommandServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task CreateRun_routes_create_architecture_through_synthesis_kernel()
    {
        Mock<IArchitectureSynthesisKernel> kernel = new();
        kernel
            .Setup(k => k.GenerateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureSynthesisGenerateResult
            {
                RunId = "run-synth",
                PackageOrigin = ArchitecturePackageOrigin.Created
            });

        Mock<IArchitectureRunCreateOrchestrator> create = new();
        ArchitectureRunCommandService sut = CreateSut(synthesisKernel: kernel.Object, createOrchestrator: create.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Description = new string('x', 20),
            SystemName = "Synth",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture
        };

        CreateRunCommandResult result = await sut.CreateRunAsync(Scope, request, null, CancellationToken.None);

        result.IsSynthesisPath.Should().BeTrue();
        result.SynthesisResult!.RunId.Should().Be("run-synth");
        create.Verify(
            c => c.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateRun_routes_review_intent_through_create_orchestrator()
    {
        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(c => c.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunResult
            {
                Run = new ArchitectureRun { RunId = "run-review", RequestId = "req-2" }
            });

        ArchitectureRunCommandService sut = CreateSut(createOrchestrator: create.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-2",
            Description = new string('x', 20),
            SystemName = "Review"
        };

        CreateRunCommandResult result = await sut.CreateRunAsync(Scope, request, "idem-key", CancellationToken.None);

        result.IsSynthesisPath.Should().BeFalse();
        result.StandardResult!.Run.RunId.Should().Be("run-review");
        create.Verify(
            c => c.CreateRunAsync(
                It.Is<ArchitectureRequest>(r => r.RequestId == "req-2"),
                It.Is<CreateRunIdempotencyState?>(state => state != null),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CommitRun_notifies_sponsor_only_on_first_successful_commit()
    {
        CommitRunResult commitResult = new()
        {
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "v1" } }
        };

        Mock<ICommitRunIdempotencyCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.CommitAsync(
                It.IsAny<CommitRunIdempotencyState?>(),
                It.IsAny<Func<CancellationToken, Task<CommitRunResult>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyOutcome(commitResult, IdempotentReplay: false));

        Mock<ICommitSponsorEmailNotifier> sponsor = new();
        ArchitectureRunCommandService sut = CreateSut(
            commitCoordinator: coordinator.Object,
            sponsorNotifier: sponsor.Object);

        CommitRunRequest request = new() { NotifySponsor = true };

        await sut.CommitRunAsync(Scope, "run-1", request, "idem-key", CancellationToken.None);

        sponsor.Verify(
            n => n.NotifyAfterCommitAsync(Scope.TenantId, "run-1", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CommitRun_skips_sponsor_notification_on_idempotent_replay()
    {
        CommitRunResult commitResult = new()
        {
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "v1" } }
        };

        Mock<ICommitRunIdempotencyCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.CommitAsync(
                It.IsAny<CommitRunIdempotencyState?>(),
                It.IsAny<Func<CancellationToken, Task<CommitRunResult>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyOutcome(commitResult, IdempotentReplay: true));

        Mock<ICommitSponsorEmailNotifier> sponsor = new();
        ArchitectureRunCommandService sut = CreateSut(
            commitCoordinator: coordinator.Object,
            sponsorNotifier: sponsor.Object);

        CommitRunRequest request = new() { NotifySponsor = true };

        await sut.CommitRunAsync(Scope, "run-1", request, "idem-key", CancellationToken.None);

        sponsor.Verify(
            n => n.NotifyAfterCommitAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteRunSelectiveAsync_invokes_incremental_re_review_coordinator_after_execute()
    {
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteSelectiveRunAsync(
                "run-selective",
                It.IsAny<SelectiveAgentExecuteRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecuteRunResult { RunId = "run-selective", Results = [] });

        Mock<ISelectiveExecuteIncrementalReReviewCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.TryRunAfterSelectiveExecuteAsync(
                "run-selective",
                It.IsAny<SelectiveAgentExecuteRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IncrementalReReviewResult());

        ArchitectureRunCommandService sut = CreateSut(
            executeOrchestrator: execute.Object,
            incrementalReReviewCoordinator: coordinator.Object);

        SelectiveAgentExecuteRequest request = new() { AgentTypes = ["Cost"] };

        await sut.ExecuteRunSelectiveAsync("run-selective", request, CancellationToken.None);

        execute.Verify(
            e => e.ExecuteSelectiveRunAsync("run-selective", request, It.IsAny<CancellationToken>()),
            Times.Once);
        coordinator.Verify(
            c => c.TryRunAfterSelectiveExecuteAsync("run-selective", request, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteRun_invokes_evidence_readiness_gate_before_execute()
    {
        Mock<IExecuteEvidenceReadinessGate> gate = new();
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteRunAsync("run-gated", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExecuteRunResult { RunId = "run-gated", Results = [] });

        ArchitectureRunCommandService sut = CreateSut(
            executeOrchestrator: execute.Object,
            evidenceReadinessGate: gate.Object);

        ExecuteRunResult result = await sut.ExecuteRunAsync("run-gated", CancellationToken.None);

        result.RunId.Should().Be("run-gated");
        gate.Verify(
            g => g.EnsureReadyAsync("run-gated", It.IsAny<CancellationToken>()),
            Times.Once);
        execute.Verify(
            e => e.ExecuteRunAsync("run-gated", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteRun_skips_execute_when_evidence_readiness_gate_throws()
    {
        Mock<IExecuteEvidenceReadinessGate> gate = new();
        gate
            .Setup(g => g.EnsureReadyAsync("run-blocked", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Evidence not ready."));

        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        ArchitectureRunCommandService sut = CreateSut(
            executeOrchestrator: execute.Object,
            evidenceReadinessGate: gate.Object);

        Func<Task> act = () => sut.ExecuteRunAsync("run-blocked", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        gate.Verify(
            g => g.EnsureReadyAsync("run-blocked", It.IsAny<CancellationToken>()),
            Times.Once);
        execute.Verify(
            e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ArchitectureRunCommandService CreateSut(
        IArchitectureRunCreateOrchestrator? createOrchestrator = null,
        IArchitectureSynthesisKernel? synthesisKernel = null,
        ICommitRunIdempotencyCoordinator? commitCoordinator = null,
        ICommitSponsorEmailNotifier? sponsorNotifier = null,
        IArchitectureRunExecuteOrchestrator? executeOrchestrator = null,
        ISelectiveExecuteIncrementalReReviewCoordinator? incrementalReReviewCoordinator = null,
        IExecuteEvidenceReadinessGate? evidenceReadinessGate = null) =>
        new(
            createOrchestrator ?? Mock.Of<IArchitectureRunCreateOrchestrator>(),
            Mock.Of<IArchitectureRunBatchCreateOrchestrator>(),
            executeOrchestrator ?? Mock.Of<IArchitectureRunExecuteOrchestrator>(),
            evidenceReadinessGate ?? Mock.Of<IExecuteEvidenceReadinessGate>(),
            Mock.Of<IReRunExecuteSealedManifestPinGate>(),
            Mock.Of<IArchitectureRunCommitOrchestrator>(),
            Mock.Of<IReplayRunService>(),
            commitCoordinator ?? Mock.Of<ICommitRunIdempotencyCoordinator>(),
            sponsorNotifier ?? Mock.Of<ICommitSponsorEmailNotifier>(),
            synthesisKernel ?? Mock.Of<IArchitectureSynthesisKernel>(),
            incrementalReReviewCoordinator ?? Mock.Of<ISelectiveExecuteIncrementalReReviewCoordinator>());
}
