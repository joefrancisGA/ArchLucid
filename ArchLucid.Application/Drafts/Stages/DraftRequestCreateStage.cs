using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Drafts.Stages;

/// <inheritdoc cref="IDraftRequestCreateStage" />
public sealed class DraftRequestCreateStage(
    IDraftRequestRepository draftRepository,
    IPriorPackageSemanticMergeService priorPackageSemanticMergeService,
    IArchitectureIdentityService architectureIdentityService) : IDraftRequestCreateStage
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IPriorPackageSemanticMergeService _priorPackageSemanticMergeService =
        priorPackageSemanticMergeService
        ?? throw new ArgumentNullException(nameof(priorPackageSemanticMergeService));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    public async Task<DraftRequestResponse> CreateAsync(
        ScopeContext scope,
        string actorUserId,
        CreateDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        string intent = request.FreeTextIntent.Trim();

        if (intent.Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            throw new InvalidOperationException(
                $"FreeTextIntent must be at least {DraftIntakeValidation.MinimumFreeTextIntentLength} characters after trim.");

        if (DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength(intent))
            throw new InvalidOperationException(
                $"FreeTextIntent must not exceed {DraftIntakeValidation.MaximumFreeTextIntentLength} characters after trim.");

        DraftRequestDocument document = new()
        {
            FreeTextIntent = intent,
            FocusedPilotModeEnabled = true,
            WorkflowIntent = DraftDocumentMutator.NormalizeWorkflowIntent(request.WorkflowIntent),
            PriorRunId = string.IsNullOrWhiteSpace(request.PriorRunId) ? null : request.PriorRunId.Trim(),
        };

        if (!string.IsNullOrWhiteSpace(document.PriorRunId))
        {
            await _priorPackageSemanticMergeService.MergePriorPackageSemanticsAsync(
                scope,
                document,
                document.PriorRunId,
                cancellationToken);
        }

        DraftRequestResponse created = await _draftRepository.CreateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            actorUserId,
            document,
            cancellationToken);

        await _architectureIdentityService.EnsureForDraftAsync(
            scope,
            created.DraftId,
            document.SystemName,
            cancellationToken).ConfigureAwait(false);

        DraftRequestResponse? refreshed = await _draftRepository.GetAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            created.DraftId,
            cancellationToken).ConfigureAwait(false);

        return refreshed ?? created;
    }
}
