using ArchLucid.Application.Architecture;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
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

    private static ArchitectureRunCommandService CreateSut(
        IArchitectureRunCreateOrchestrator? createOrchestrator = null,
        IArchitectureSynthesisKernel? synthesisKernel = null,
        ICommitRunIdempotencyCoordinator? commitCoordinator = null,
        ICommitSponsorEmailNotifier? sponsorNotifier = null) =>
        new(
            createOrchestrator ?? Mock.Of<IArchitectureRunCreateOrchestrator>(),
            Mock.Of<IArchitectureRunBatchCreateOrchestrator>(),
            Mock.Of<IArchitectureRunExecuteOrchestrator>(),
            Mock.Of<IArchitectureRunCommitOrchestrator>(),
            Mock.Of<IReplayRunService>(),
            commitCoordinator ?? Mock.Of<ICommitRunIdempotencyCoordinator>(),
            sponsorNotifier ?? Mock.Of<ICommitSponsorEmailNotifier>(),
            synthesisKernel ?? Mock.Of<IArchitectureSynthesisKernel>());
}
