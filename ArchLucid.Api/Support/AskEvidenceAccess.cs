using System.Security.Claims;

using ArchLucid.Application.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services.Ask;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Support;

/// <summary>Bridges Ask to the same HTTP principal and run-share decision used by API controllers.</summary>
public sealed class AskEvidenceAccess(
    ArchitectureShareAccessGate gate, IHttpContextAccessor context, IActorContext actor) : IAskEvidenceAccess
{
    public string? GetAuthorizedActorId()
    {
        ClaimsPrincipal? user = context.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true ||
            !ArchitectureShareAuthorityProbe.HasReadAuthority(user))
            return null;

        return actor.GetActorId();
    }

    public async Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        if (runId == Guid.Empty || string.IsNullOrWhiteSpace(GetAuthorizedActorId()) ||
            context.HttpContext?.User is not { } user)
            return false;

        (bool found, bool canRead) = await gate.EvaluateRunReadAsync(user, scope, runId, ct);
        return found && canRead;
    }

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
