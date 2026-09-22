using System.Security.Claims;

using ArchLucid.Application.Architecture;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Support;

/// <summary>AS-091 / ADR 0087: application-layer share gate for architecture and run-scoped reads/decides.</summary>
public interface IArchitectureShareAccessGate
{
    Task<ArchitectureShareAccessEvaluation> EvaluateArchitectureAsync(
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<IActionResult?> EnsureArchitectureReadAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<IActionResult?> EnsureArchitectureDecideAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<IActionResult?> EnsureRunReadAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<IActionResult?> EnsureRunDecideAllowedAsync(
        ControllerBase controller,
        ClaimsPrincipal user,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);
}
