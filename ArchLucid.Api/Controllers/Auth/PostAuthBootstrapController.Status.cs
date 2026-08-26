using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class PostAuthBootstrapController
{
    [HttpGet("status")]
    [ProducesResponseType(typeof(PostAuthBootstrapStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatusAsync(
        [FromQuery] string? returnUrl,
        [FromQuery] string? invitationToken,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await ResolveUserAsync(cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Unauthorized();
        }

        if (!IdentityEmailNormalizer.TryNormalize(user.NormalizedPrimaryEmail ?? user.PrimaryEmail ?? string.Empty,
                out string normalizedEmail, out _))
        {
            return this.BadRequestProblem("A verified email address is required.", ProblemTypes.ValidationFailed);
        }

        string safeReturn = SanitizeReturnPath(returnUrl);
        PostAuthBootstrapStatusResult status =
            await _bootstrap.ResolveStatusAsync(user.Id, normalizedEmail, safeReturn, invitationToken, cancellationToken)
                .ConfigureAwait(false);

        return Ok(MapStatus(status));
    }

    private static PostAuthBootstrapStatusResponse MapStatus(PostAuthBootstrapStatusResult status) =>
        new()
        {
            Destination = status.Destination.ToString(),
            PendingInvitations = status.PendingInvitations
                .Select(row => new PostAuthBootstrapInvitationResponse
                {
                    InvitationId = row.InvitationId,
                    Label = row.Label,
                    MaskedInvitedEmail = row.MaskedInvitedEmail,
                    RequiresEmailMismatchConfirmation = row.RequiresEmailMismatchConfirmation,
                    ConfirmationMessage = row.ConfirmationMessage
                })
                .ToList(),
            Workspaces = status.Workspaces
                .Select(row => new PostAuthBootstrapWorkspaceResponse
                {
                    TenantId = row.TenantId,
                    WorkspaceId = row.WorkspaceId,
                    WorkspaceName = row.WorkspaceName
                })
                .ToList(),
            ResumePath = status.ResumePath,
            DuplicateOrganization = MapDuplicate(status.DuplicateOrganization),
            CanCreateWorkspace = status.CanCreateWorkspace,
            DenialReason = status.DenialReason
        };

    private static PostAuthBootstrapDuplicateOrganizationResponse? MapDuplicate(
        PostAuthBootstrapDuplicateOrganizationHint? hint)
    {
        if (hint is null || !hint.Detected)
        {
            return null;
        }

        return new PostAuthBootstrapDuplicateOrganizationResponse
        {
            Detected = hint.Detected,
            AccessRequestRecommended = hint.AccessRequestRecommended,
            CustomerMessage = hint.CustomerMessage
        };
    }
}
