using System.Security.Claims;

using ArchLucid.Application.Common;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services.Ask;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Support;

/// <summary>Bridges Ask and infrastructure evidence citation reads to the same HTTP principal and run-share decision used by API controllers.</summary>
public sealed class AskEvidenceAccess(
    ArchitectureShareAccessGate gate, IHttpContextAccessor context, IActorContext actor) : IAskEvidenceAccess, IInfraEvidenceRunReadAccess
{
    public string? GetAuthorizedActorId()
    {
        ClaimsPrincipal? user = context.HttpContext?.User;

        if (user?.Identity?.IsAuthenticated != true ||
            !ArchitectureShareAuthorityProbe.HasReadAuthority(user))
            return null;

        string actorId = actor.GetActorId();
        // The audit fallback is not an identified principal for evidence access.
        return string.IsNullOrWhiteSpace(actorId) ||
               string.Equals(actorId, "api-user", StringComparison.OrdinalIgnoreCase)
            ? null
            : actorId;
    }

    public async Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        if (runId == Guid.Empty || string.IsNullOrWhiteSpace(GetAuthorizedActorId()) ||
            context.HttpContext?.User is not { } user)
            return false;

        (bool found, bool canRead) = await gate.EvaluateRunReadAsync(user, scope, runId, ct);
        return found && canRead;
    }

    public string? GetAuthorizedDraftActorId() =>
        context.HttpContext?.User is { } user && ArchitectureShareAuthorityProbe.HasExecuteAuthority(user)
            ? GetAuthorizedActorId()
            : null;

    public async Task<bool> CanDecideArchitectureAsync(ScopeContext scope, Guid architectureId, CancellationToken ct)
    {
        if (architectureId == Guid.Empty || string.IsNullOrWhiteSpace(GetAuthorizedActorId()) ||
            context.HttpContext?.User is not { } user ||
            !ArchitectureShareAuthorityProbe.HasExecuteAuthority(user))
            return false;

        var access = await gate.EvaluateArchitectureAsync(user, scope, architectureId, ct);
        return access.ArchitectureFound && access.CanRead && access.CanDecide;
    }

}
