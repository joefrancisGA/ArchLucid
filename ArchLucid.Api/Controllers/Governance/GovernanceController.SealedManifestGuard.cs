using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail;

        try
        {
            detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapGovernanceSealedManifestConflict(ex);
        }

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapGovernanceSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedForApprovalRequestAsync(
        string approvalRequestId,
        IGovernanceApprovalRequestRepository approvalRepository,
        CancellationToken cancellationToken)
    {
        GovernanceApprovalRequest? approval = await approvalRepository.GetByIdAsync(approvalRequestId, cancellationToken);

        if (approval is null || string.IsNullOrWhiteSpace(approval.RunId))
            return null;

        return await EnsureSealedManifestReadAllowedAsync(approval.RunId, cancellationToken);
    }

    private async Task<IActionResult?> EnsureGovernanceInsightsScopeSealedManifestReadAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapGovernanceSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureDryRunRunIdsSealedManifestReadAllowedAsync(
        IEnumerable<string> runIds,
        CancellationToken cancellationToken)
    {
        foreach (string runId in runIds)
        {
            if (string.IsNullOrWhiteSpace(runId))
                continue;

            IActionResult? guardResult = await EnsureSealedManifestReadAllowedAsync(runId.Trim(), cancellationToken);

            if (guardResult is not null)
                return guardResult;
        }

        return null;
    }

    /// <summary>
    ///     Maps governance dry-run/simulate/insights <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGovernanceSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
