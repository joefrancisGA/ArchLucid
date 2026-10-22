using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts.PriorAnswerReuse;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

public sealed partial class DraftAdmissionService
{
    /// <inheritdoc />
    public async Task<DraftAdmissionResponse?> RequestAdmissionAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DraftRequestResponse? existing = await _crudService.GetAsync(scope, draftId, cancellationToken);

        if (existing is null)
            return null;

        if (!DraftRequestStateMachine.AllowsAdmission(existing.Status))
            throw new InvalidOperationException(
                $"Draft '{draftId}' cannot request admission from status '{existing.Status}'.");

        ArchitectureRequest safetyProbe = _projector.Project(existing.Document, draftId);
        RequestContentSafetyResult safety =
            await _contentSafetyPrecheck.EvaluateAsync(safetyProbe, cancellationToken);

        if (!safety.IsAllowed)
        {
            string reason = string.Join("; ", safety.Reasons);

            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                reason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                reason);
        }

        DraftAdmissionEvaluation evaluation = _admissionGate.Evaluate(existing.Document);

        if (!evaluation.Admitted)
        {
            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                evaluation.RedirectReason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                evaluation.RedirectReason);
        }

        DraftAdmissionEvaluation? semanticRedirect =
            await DraftAdmissionResponseComposer.TrySemanticRedirectAsync(
                _semanticAdmissionEvaluator,
                existing.Document,
                cancellationToken);

        if (semanticRedirect is not null)
        {
            DraftRequestResponse? redirected = await _draftRepository.UpdateAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                draftId,
                DraftRequestStatus.Redirected,
                existing.Document,
                semanticRedirect.RedirectReason,
                existing.SpawnedRunId,
                cancellationToken);

            return DraftAdmissionResponseComposer.BuildAdmissionResponse(
                _feasibilityVerdictBuilder,
                redirected!,
                admitted: false,
                semanticRedirect.RedirectReason);
        }

        await ApplyPriorAnswerReuseAsync(scope, draftId, existing.Document, cancellationToken);

        QuestionSelectionResult selection = await _questionSelectionEngine.SelectAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            existing.Document,
            cancellationToken);

        existing.Document.RequiredMustQuestionKeys =
            DraftAdmissionResponseComposer.ExtractAllMustQuestionKeys(selection);

        DraftRequestResponse? admitted = await _draftRepository.UpdateAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            draftId,
            DraftRequestStatus.Admitted,
            existing.Document,
            redirectReason: null,
            existing.SpawnedRunId,
            cancellationToken);

        return DraftAdmissionResponseComposer.BuildAdmissionResponse(
            _feasibilityVerdictBuilder,
            admitted!,
            admitted: true,
            redirectReason: null,
            selection);
    }
}
