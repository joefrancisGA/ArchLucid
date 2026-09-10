using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Support;

public sealed class ArchitectureShareAccessGate(
    IArchitectureShareAccessService shareAccessService,
    IAuthenticatedPlatformUserResolver platformUserResolver,
    IRunRepository runRepository) : IArchitectureShareAccessGate
{
    private readonly IArchitectureShareAccessService _shareAccessService =
        shareAccessService ?? throw new ArgumentNullException(nameof(shareAccessService));

    private readonly IAuthenticatedPlatformUserResolver _platformUserResolver =
        platformUserResolver ?? throw new ArgumentNullException(nameof(platformUserResolver));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public async Task<ArchitectureShareAccessEvaluation> EvaluateArchitectureAsync(
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        ArgumentNullException.ThrowIfNull(scope);

        Guid? actorUserId = await ResolveActorUserIdAsync(user, cancellationToken);

        return await _shareAccessService.EvaluateAsync(
            scope,
            architectureId,
            actorUserId,
            ArchitectureShareAuthorityProbe.HasReadAuthority(user),
            ArchitectureShareAuthorityProbe.HasExecuteAuthority(user),
            ArchitectureShareAuthorityProbe.HasWorkspaceAdminAuthority(user),
            cancellationToken);
    }

    public async Task<IActionResult?> EnsureArchitectureReadAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.ArchitectureFound || !access.CanRead)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.ArchitectureNotFound(controller, architectureId);

        return null;
    }

    public async Task<IActionResult?> EnsureArchitectureDecideAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.ArchitectureFound || !access.CanDecide)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.ArchitectureNotFound(controller, architectureId);

        return null;
    }

    public async Task<IActionResult?> EnsureRunReadAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, runId);

        if (run.ArchitectureId is not Guid architectureId)
            return null;

        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.CanRead)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, runId);

        return null;
    }

    public async Task<IActionResult?> EnsureRunDecideAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, runId);

        if (run.ArchitectureId is not Guid architectureId)
            return null;

        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.CanDecide)
            return ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, runId);

        return null;
    }

    private async Task<Guid?> ResolveActorUserIdAsync(ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        PlatformUserRecord? platformUser = await _platformUserResolver.ResolveAsync(user, cancellationToken);

        return platformUser?.Id;
    }
}
