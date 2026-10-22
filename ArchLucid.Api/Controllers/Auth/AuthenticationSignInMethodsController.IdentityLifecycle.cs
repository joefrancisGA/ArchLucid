using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Audit;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class AuthenticationSignInMethodsController
{
    [HttpDelete("{identityId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveAsync(Guid identityId, CancellationToken cancellationToken)
    {
        IActionResult? recentAuthError = EnsureRecentAuthenticationOrError();

        if (recentAuthError is not null)
        {
            return recentAuthError;
        }

        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);
        string actorId = ResolveActorId(user);

        try
        {
            await _linkingService.RemoveSignInMethodAsync(user.Id, identityId, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityRemovalRequested,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new { identityId })
                },
                cancellationToken).ConfigureAwait(false);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (SignInMethodRemovalBlockedException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (FinalSignInMethodRemovalException)
        {
            return this.BadRequestProblem(
                "At least one sign-in method must remain on your account.",
                ProblemTypes.ValidationFailed);
        }
    }
}
