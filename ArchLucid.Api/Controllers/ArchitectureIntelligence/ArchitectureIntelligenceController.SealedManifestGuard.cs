using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceController
{
    private async Task<IActionResult?> EnsureArchitectureIntelligenceRunCreateSealedManifestAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await DraftIntakeSealedManifestReadGuard.EnsureDraftIntakeReadAllowedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken,
                canReadRun: async (runId, ct) =>
                {
                    (bool found, bool canRead) = await _architectureShareAccessGate.EvaluateRunReadAsync(User, scope, runId, ct);
                    return found && canRead;
                });
        }
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }

        return null;
    }

    // Product runs use architecture sharing. A standalone run must instead have a
    // server-issued binding for this actor and the exact authenticated scope.
    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        bool requireDecide,
        CancellationToken cancellationToken,
        bool allowStandalone = true)
    {
        (bool found, bool canRead) = await _architectureShareAccessGate.EvaluateRunReadAsync(
            User, scope, runId, cancellationToken);

        if (!found)
        {
            string? actorId = allowStandalone ? GetStandaloneRunActorId() : null;
            if (actorId is not null
                && await _standaloneRunStore.IsOwnedByAsync(scope, runId, actorId, cancellationToken))
            {
                return null;
            }

            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(this, runId);
        }

        if (!canRead)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(this, runId);

        if (requireDecide)
        {
            IActionResult? decideDenied = await _architectureShareAccessGate.EnsureRunDecideAllowedAsync(
                this, User, scope, runId, cancellationToken);

            if (decideDenied is not null)
                return decideDenied;
        }

        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);
        if (detail?.GoldenManifest is not null)
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                _manifestHashService);
        }

        return null;
    }

    private string? GetStandaloneRunActorId()
    {
        string actorId = _actorContext.GetActorId();
        return string.IsNullOrWhiteSpace(actorId) || string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase)
            ? null
            : actorId;
    }

    /// <summary>
    ///     Maps architecture-intelligence read/mutation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapArchitectureIntelligenceSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
