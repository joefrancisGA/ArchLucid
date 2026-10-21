using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http.Governance;

/// <summary>
///     Single API entry point for scope-posture sealed-manifest verification (latest committed run).
/// </summary>
public static class GovernanceScopePostureSealedManifestPreflight
{
    public static async Task<IActionResult?> TryGetConflictResultAsync(
        ControllerBase controller,
        ScopeContext scope,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        await TryGetConflictResultAsync(
            controller,
            scope,
            runDetailQueryService,
            authorityQueryService,
            manifestHashService,
            static (controllerBase, exception) =>
                controllerBase.ConflictProblem(exception.Message, ProblemTypes.Conflict),
            cancellationToken);

    public static async Task<IActionResult?> TryGetConflictResultAsync(
        ControllerBase controller,
        ScopeContext scope,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        Func<ControllerBase, ConflictException, IActionResult> mapConflict,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(mapConflict);

        try
        {
            await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runDetailQueryService,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return mapConflict(controller, ex);
        }

        return null;
    }

    public static async Task<IActionResult?> TryGetConflictResultAsync(
        ControllerBase controller,
        ScopeContext scope,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ScopeContext scoped = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = projectId,
        };

        return await TryGetConflictResultAsync(
            controller,
            scoped,
            runDetailQueryService,
            authorityQueryService,
            manifestHashService,
            static (controllerBase, exception) =>
                controllerBase.ConflictProblem(exception.Message, ProblemTypes.Conflict),
            cancellationToken);
    }
}
