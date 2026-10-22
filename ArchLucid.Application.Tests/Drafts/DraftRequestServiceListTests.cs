using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestServiceListTests
{
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private readonly DraftRequestService _service;

    public DraftRequestServiceListTests()
    {
        IDraftRequestRepository repository = new InMemoryDraftRequestRepository();
        Mock<IEffectiveGovernanceLoader> governanceLoader = new();
        Mock<IArchitectureRunCommandService> architectureRunCommandService = new();
        Mock<IRequestContentSafetyPrecheck> contentSafety = new();

        governanceLoader
            .Setup(static loader => loader.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        contentSafety
            .Setup(static s => s.EvaluateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        DraftRunCommandServiceTestDoubles.SetupStandardReviewCreate(architectureRunCommandService);

        _service = DraftRequestServiceTestFactory.CreateWithDefaults(
            repository,
            governanceLoader,
            architectureRunCommandService,
            contentSafety,
            new DraftIntakeBranchOptions());
    }

    [Fact]
    public async Task ListAsync_returns_only_creator_drafts_in_workspace()
    {
        DraftRequestResponse mine = await _service.CreateAsync(
            _scope,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        ScopeContext otherWorkspace = new()
        {
            TenantId = _scope.TenantId,
            WorkspaceId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            ProjectId = _scope.ProjectId,
        };

        await _service.CreateAsync(
            otherWorkspace,
            "user-1",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        await _service.CreateAsync(
            _scope,
            "user-2",
            new CreateDraftRequest { FreeTextIntent = DraftIntakeTestIntents.ValidGrcWorkflow },
            CancellationToken.None);

        PagedResponse<DraftRequestSummaryResponse> page = await _service.ListAsync(
            _scope,
            "user-1",
            DraftRequestListStatusFilter.DefaultInventoryStatuses,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        page.Items.Should().ContainSingle();
        page.Items[0].DraftId.Should().Be(mine.DraftId);
        page.Items[0].FreeTextIntent.Should().Contain("GRC");
    }
}
