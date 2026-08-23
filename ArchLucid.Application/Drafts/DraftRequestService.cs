using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftRequestService" />
public sealed class DraftRequestService(
    IDraftRequestCrudService crudService,
    IDraftAdmissionService admissionService,
    IDraftBranchingService branchingService) : IDraftRequestService
{
    private readonly IDraftRequestCrudService _crudService =
        crudService ?? throw new ArgumentNullException(nameof(crudService));

    private readonly IDraftAdmissionService _admissionService =
        admissionService ?? throw new ArgumentNullException(nameof(admissionService));

    private readonly IDraftBranchingService _branchingService =
        branchingService ?? throw new ArgumentNullException(nameof(branchingService));

    /// <inheritdoc />
    public Task<DraftRequestResponse> CreateAsync(
        ScopeContext scope,
        string actorUserId,
        CreateDraftRequest request,
        CancellationToken cancellationToken)
        => _crudService.CreateAsync(scope, actorUserId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> GetAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
        => _crudService.GetAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> PatchAsync(
        ScopeContext scope,
        Guid draftId,
        PatchDraftRequest patch,
        CancellationToken cancellationToken)
        => _crudService.PatchAsync(scope, draftId, patch, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> AnswerQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        AnswerDraftQuestionRequest request,
        CancellationToken cancellationToken)
        => _crudService.AnswerQuestionAsync(scope, draftId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> SkipQuestionAsync(
        ScopeContext scope,
        Guid draftId,
        SkipDraftQuestionRequest request,
        CancellationToken cancellationToken)
        => _crudService.SkipQuestionAsync(scope, draftId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftAdmissionResponse?> RequestAdmissionAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
        => _admissionService.RequestAdmissionAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<DraftQuestionsResponse?> GetQuestionsAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
        => _admissionService.GetQuestionsAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<SubmitDraftResponse?> SubmitAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
        => _admissionService.SubmitAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> AbandonAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
        => _crudService.AbandonAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<DraftRequestResponse?> ReopenAsync(ScopeContext scope, Guid draftId, CancellationToken cancellationToken)
        => _crudService.ReopenAsync(scope, draftId, cancellationToken);

    /// <inheritdoc />
    public Task<BranchDraftResponse?> BranchAsync(
        ScopeContext scope,
        Guid parentDraftId,
        string actorUserId,
        BranchDraftRequest request,
        CancellationToken cancellationToken)
        => _branchingService.BranchAsync(scope, parentDraftId, actorUserId, request, cancellationToken);

    /// <inheritdoc />
    public Task<DraftBranchQuotaResponse?> GetBranchQuotaAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
        => _branchingService.GetBranchQuotaAsync(scope, draftId, cancellationToken);
}
