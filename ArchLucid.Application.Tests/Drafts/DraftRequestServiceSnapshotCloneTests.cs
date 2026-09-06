using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestServiceSnapshotCloneTests
{
    private static readonly string SpawnedRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString("D");

    private readonly IDraftRequestRepository _repository = new InMemoryDraftRequestRepository();
    private readonly Mock<IEffectiveGovernanceLoader> _governanceLoader = new();
    private readonly Mock<IArchitectureRunCommandService> _architectureRunCommandService = new();
    private readonly Mock<IRequestContentSafetyPrecheck> _contentSafety = new();
    private readonly DraftRequestService _service;
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    public DraftRequestServiceSnapshotCloneTests()
    {
        _governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        _contentSafety
            .Setup(static s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        DraftRunCommandServiceTestDoubles.SetupStandardReviewCreate(_architectureRunCommandService);

        _service = DraftRequestServiceTestFactory.CreateWithDefaults(
            _repository,
            _governanceLoader,
            _architectureRunCommandService,
            _contentSafety,
            new DraftIntakeBranchOptions { MaxBranchesPerParentDraft = 3 });
    }

    [Fact]
    public async Task CloneSnapshotAsync_returns_new_drafting_id_and_leaves_source_locked()
    {
        DraftRequestResponse source = await CreateRunSpawnedParentAsync();

        CloneSnapshotDraftResponse? clone = await _service.CloneSnapshotAsync(
            _scope,
            source.DraftId,
            "operator-1",
            CancellationToken.None);

        clone.Should().NotBeNull();
        clone!.SourceDraftId.Should().Be(source.DraftId);
        clone.SourceSpawnedRunId.Should().Be(SpawnedRunId);
        clone.Clone.DraftId.Should().NotBe(source.DraftId);
        clone.Clone.Status.Should().Be(DraftRequestStatus.Drafting);
        clone.Clone.SpawnedRunId.Should().BeNull();
        clone.Clone.Document.ParentDraftId.Should().Be(source.DraftId);

        DraftRequestResponse? sourceReloaded = await _service.GetAsync(_scope, source.DraftId, CancellationToken.None);
        sourceReloaded!.Status.Should().Be(DraftRequestStatus.RunSpawned);
        sourceReloaded.SpawnedRunId.Should().Be(SpawnedRunId);
    }

    [Fact]
    public async Task CloneSnapshotAsync_keeps_parent_architecture_id()
    {
        DraftRequestResponse source = await CreateRunSpawnedParentAsync();

        source.ArchitectureId.Should().NotBeNull();

        CloneSnapshotDraftResponse? clone = await _service.CloneSnapshotAsync(
            _scope,
            source.DraftId,
            "operator-1",
            CancellationToken.None);

        clone.Should().NotBeNull();
        clone!.Clone.ArchitectureId.Should().Be(source.ArchitectureId);
        clone.Clone.ArchitectureId.Should().NotBe(clone.Clone.DraftId);
    }

    [Fact]
    public async Task CloneSnapshotAsync_rejects_non_spawned_parent()
    {
        DraftRequestResponse admitted = await CreateAdmittedParentAsync();

        Func<Task> act = () => _service.CloneSnapshotAsync(
            _scope,
            admitted.DraftId,
            "operator-1",
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot clone a snapshot*");
    }

    private async Task<DraftRequestResponse> CreateAdmittedParentAsync()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "operator-1",
            new CreateDraftRequest
            {
                FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow,
            },
            CancellationToken.None);

        await _service.PatchAsync(
            _scope,
            created.DraftId,
            new PatchDraftRequest
            {
                BusinessOutcome = "Faster audit prep",
                ActorSet = new ActorSet
                {
                    Actors =
                    [
                        new ActorDescriptor
                        {
                            Kind = ActorKind.Human,
                            TrustOrigin = TrustOrigin.Internal,
                            Contract = InteractionContract.Sync,
                            Origin = ActorOrigin.Asserted,
                        },
                    ],
                },
            },
            CancellationToken.None);

        DraftAdmissionResponse? admission = await _service.RequestAdmissionAsync(
            _scope,
            created.DraftId,
            CancellationToken.None);

        admission.Should().NotBeNull();
        admission!.Admitted.Should().BeTrue();

        return admission.Draft;
    }

    private async Task<DraftRequestResponse> CreateRunSpawnedParentAsync()
    {
        DraftRequestResponse admitted = await CreateAdmittedParentAsync();

        DraftRequestResponse? spawned = await _repository.UpdateAsync(
            _scope.TenantId,
            _scope.WorkspaceId,
            _scope.ProjectId,
            admitted.DraftId,
            DraftRequestStatus.RunSpawned,
            admitted.Document,
            redirectReason: null,
            spawnedRunId: SpawnedRunId,
            cancellationToken: CancellationToken.None);

        spawned.Should().NotBeNull();
        spawned!.Status.Should().Be(DraftRequestStatus.RunSpawned);

        return spawned;
    }
}
