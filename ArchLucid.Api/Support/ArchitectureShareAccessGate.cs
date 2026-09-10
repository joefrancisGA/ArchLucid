using System.Security.Claims;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Support;

public sealed class ArchitectureShareAccessGate(
    IArchitectureShareAccessService shareAccessService,
    IActorContext actorContext,
    IRunRepository runRepository) : IArchitectureShareAccessGate
{
    private readonly IArchitectureShareAccessService _shareAccessService =
        shareAccessService ?? throw new ArgumentNullException(nameof(shareAccessService));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

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

        return await _shareAccessService.EvaluateAsync(
            scope,
            architectureId,
            _actorContext.GetActorId(),
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
        {
            return controller.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

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
        {
            return controller.NotFoundProblem(
                $"Architecture '{architectureId:D}' was not found.",
                ProblemTypes.ResourceNotFound);
        }

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
        {
            return controller.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);
        }

        if (run.ArchitectureId is not Guid architectureId)
            return null;

        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.CanRead)
        {
            return controller.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);
        }

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
        {
            return controller.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);
        }

        if (run.ArchitectureId is not Guid architectureId)
            return null;

        ArchitectureShareAccessEvaluation access =
            await EvaluateArchitectureAsync(user, scope, architectureId, cancellationToken);

        if (!access.CanDecide)
        {
            return controller.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);
        }

        return null;
    }
}
