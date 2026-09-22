using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingAnalysisContextBuilderPriorResolveTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid CurrentRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid PriorRunId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid PriorGraphSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid CurrentVersionId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly byte[] PinnedArchitectureVersionContentHashSha256 = [0xAA, 0xBB, 0xCC];

    [Fact]
    public async Task BuildAsync_second_architecture_review_resolves_prior_sealed_graph_from_architecture_identity()
    {
        DateTime currentCreatedUtc = new(2026, 7, 19, 12, 0, 0, DateTimeKind.Utc);
        FindingAnalysisContextBuilder sut = CreateSut(
            currentHeader: BuildCurrentHeader(currentCreatedUtc, isSample: false),
            priorHeader: BuildPriorHeader());

        FindingAnalysisContext context = await sut.BuildAsync(
            TestScope,
            CurrentRunId,
            new ContextSnapshot { SnapshotId = Guid.NewGuid(), RunId = CurrentRunId, ProjectId = "default" },
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().NotBeNull();
        context.Prior!.PriorRunId.Should().Be(PriorRunId);
        context.Prior.PriorGraphSnapshotId.Should().Be(PriorGraphSnapshotId);
    }

    [Fact]
    public async Task BuildAsync_first_architecture_review_does_not_invent_prior_graph()
    {
        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, CurrentRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCurrentHeader(new DateTime(2026, 7, 19, 12, 0, 0, DateTimeKind.Utc), isSample: false));
        runRepository
            .Setup(repository => repository.GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
                TestScope,
                ArchitectureId,
                CurrentRunId,
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        FindingAnalysisContextBuilder sut = CreateSut(runRepository);

        FindingAnalysisContext context = await sut.BuildAsync(
            TestScope,
            CurrentRunId,
            new ContextSnapshot { SnapshotId = Guid.NewGuid(), RunId = CurrentRunId, ProjectId = "default" },
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().BeNull();
    }

    [Fact]
    public async Task BuildAsync_sample_run_skips_architecture_prior_for_demo_safety()
    {
        FindingAnalysisContextBuilder sut = CreateSut(
            currentHeader: BuildCurrentHeader(new DateTime(2026, 7, 19, 12, 0, 0, DateTimeKind.Utc), isSample: true),
            priorHeader: BuildPriorHeader());

        FindingAnalysisContext context = await sut.BuildAsync(
            TestScope,
            CurrentRunId,
            new ContextSnapshot { SnapshotId = Guid.NewGuid(), RunId = CurrentRunId, ProjectId = "default" },
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().BeNull();
    }

    private static FindingAnalysisContextBuilder CreateSut(
        RunRecord currentHeader,
        RunRecord priorHeader)
    {
        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, CurrentRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentHeader);
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, PriorRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(priorHeader);
        runRepository
            .Setup(repository => repository.GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
                TestScope,
                ArchitectureId,
                CurrentRunId,
                currentHeader.CreatedUtc,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PriorRunId);

        return CreateSut(runRepository);
    }

    private static FindingAnalysisContextBuilder CreateSut(Mock<IRunRepository> runRepository)
    {
        Mock<IArchitectureVersionRepository> architectureVersions = new();
        architectureVersions
            .Setup(repository => repository.GetByIdAsync(TestScope, CurrentVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureVersionRecord
            {
                ArchitectureVersionId = CurrentVersionId,
                ArchitectureId = ArchitectureId,
                VersionNumber = 1,
                ContentHashSha256 = PinnedArchitectureVersionContentHashSha256,
            });

        Mock<IRunPolicyPackPinService> policyPins = new();
        policyPins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunEvidencePackagePinService> evidencePins = new();
        evidencePins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        evidencePins
            .Setup(service => service.ResolvePinsFromHeader(It.IsAny<RunRecord?>()))
            .Returns(Array.Empty<EvidencePackagePin>());
        evidencePins
            .Setup(service => service.HasCreateTimePinCommitment(It.IsAny<RunRecord?>()))
            .Returns(false);

        return new FindingAnalysisContextBuilder(
            runRepository.Object,
            architectureVersions.Object,
            Mock.Of<IPolicyPackVersionRepository>(),
            evidencePins.Object,
            policyPins.Object);
    }

    private static RunRecord BuildCurrentHeader(DateTime createdUtc, bool isSample) =>
        new()
        {
            RunId = CurrentRunId,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureId = ArchitectureId,
            ArchitectureVersionId = CurrentVersionId,
            PinnedPolicyPackIdsJson = "[]",
            PinnedArchitectureVersionContentHashSha256 = PinnedArchitectureVersionContentHashSha256,
            CreatedUtc = createdUtc,
            IsSample = isSample,
        };

    private static RunRecord BuildPriorHeader() =>
        new()
        {
            RunId = PriorRunId,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureId = ArchitectureId,
            ArchitectureVersionId = CurrentVersionId,
            GraphSnapshotId = PriorGraphSnapshotId,
            GoldenManifestId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
        };
}
