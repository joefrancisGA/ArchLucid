using ArchLucid.Application.Drafts.Stages;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftRequestCrudService" />
public sealed class DraftRequestCrudService(
    IDraftRequestRepository draftRepository,
    IDraftRequestCreateStage createStage,
    IDraftRequestMutateStage mutateStage,
    IDraftRequestDeleteStage deleteStage) : IDraftRequestCrudService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IDraftRequestCreateStage _createStage =
        createStage ?? throw new ArgumentNullException(nameof(createStage));

    private readonly IDraftRequestMutateStage _mutateStage =
        mutateStage ?? throw new ArgumentNullException(nameof(mutateStage));

    private readonly IDraftRequestDeleteStage _deleteStage =
        deleteStage ?? throw new ArgumentNullException(nameof(deleteStage));

    /// <inheritdoc />
    public Task<DraftRequestResponse> CreateAsync(
        ScopeContext scope,
        string actorUserId,
        CreateDraftRequest request,
        CancellationToken cancellationToken) =>
        _createStage.CreateAsync(scope, actorUserId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _draftRepository.GetAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, draftId, cancellationToken);
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> PatchAsync(
        ScopeContext scope,
        Guid draftId,
        PatchDraftRequest patch,
        CancellationToken cancellationToken) =>
        _mutateStage.PatchAsync(scope, draftId, patch, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> AnswerQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        AnswerDraftQuestionRequest request,
        CancellationToken cancellationToken) =>
        _mutateStage.AnswerQuestionAsync(scope, draftId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> SkipQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        SkipDraftQuestionRequest request,
        CancellationToken cancellationToken) =>
        _mutateStage.SkipQuestionAsync(scope, draftId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken) =>
        _deleteStage.AbandonAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> ReopenAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken) =>
        _mutateStage.ReopenAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public async Task<PagedResponse<DraftRequestSummaryResponse>> ListAsync(
        ScopeContext scope,
        string actorUserId,
        IReadOnlyList<DraftRequestStatus> statuses,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        if (statuses is null || statuses.Count == 0)
            throw new ArgumentException("At least one status filter is required.", nameof(statuses));

        PagedResponse<DraftRequestResponse> draftPage = await _draftRepository.ListForCreatorInWorkspaceAsync(
            scope.TenantId,
            scope.WorkspaceId,
            actorUserId,
            statuses,
            page,
            pageSize,
            cancellationToken);

        IReadOnlyList<DraftRequestSummaryResponse> summaries = draftPage.Items
            .Select(DraftRequestSummaryMapper.FromResponse)
            .ToList();

        return new PagedResponse<DraftRequestSummaryResponse>
        {
            Items = summaries,
            TotalCount = draftPage.TotalCount,
            Page = draftPage.Page,
            PageSize = draftPage.PageSize,
        };
    }
}
