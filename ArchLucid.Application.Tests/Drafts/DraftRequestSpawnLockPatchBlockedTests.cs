using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

/// <summary>
/// SN-031 ratchet: run-spawned drafts reject PATCH — server-side one-writer for SN-004.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DraftRequestSpawnLockPatchBlockedTests
{
    private const string SpawnedRunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

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

    public DraftRequestSpawnLockPatchBlockedTests()
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
            new DraftIntakeBranchOptions());
    }

    [Fact]
    public async Task PatchAsync_WhenRunSpawned_RejectsDocumentMutation()
    {
        DraftRequestResponse created = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        DraftRequestResponse? spawned = await _repository.UpdateAsync(
            _scope.TenantId,
            _scope.WorkspaceId,
            _scope.ProjectId,
            created.DraftId,
            DraftRequestStatus.RunSpawned,
            created.Document,
            redirectReason: null,
            spawnedRunId: SpawnedRunId,
            cancellationToken: CancellationToken.None);

        spawned.Should().NotBeNull();
        spawned!.Status.Should().Be(DraftRequestStatus.RunSpawned);

        Func<Task> act = () => _service.PatchAsync(
            _scope,
            spawned.DraftId,
            new PatchDraftRequest
            {
                BusinessOutcome = "Should not apply after spawn lock",
                ExpectedUpdatedUtc = spawned.UpdatedUtc,
            },
            CancellationToken.None);

        FluentAssertions.Specialized.ExceptionAssertions<InvalidOperationException> thrown =
            await act.Should().ThrowAsync<InvalidOperationException>();

        thrown.Which.Message.Should().Contain("not mutable in status");
        thrown.Which.Message.Should().Contain(nameof(DraftRequestStatus.RunSpawned));
    }
}
