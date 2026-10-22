using ArchLucid.Application.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public enum InvitationPublicStatus
{
    Valid = 0,
    Invalid = 1,
    Expired = 2,
    Revoked = 3,
    Accepted = 4
}

public sealed class InvitationPublicValidationResult
{
    public InvitationPublicStatus Status
    {
        get;
        init;
    }

    public string? MaskedInvitedEmail
    {
        get;
        init;
    }

    public bool AllowEmailCode
    {
        get;
        init;
    }

    public bool RequireEnterpriseSso
    {
        get;
        init;
    }

    public string? RoutingMessage
    {
        get;
        init;
    }

    public string? AppRole
    {
        get;
        init;
    }
}

public interface IUserInvitationFlowService
{
    Task<InvitationPublicValidationResult> ValidateTokenPublicAsync(
        string invitationToken,
        CancellationToken cancellationToken);

    Task<UserInvitationRecord?> ResolvePendingByTokenAsync(
        string invitationToken,
        CancellationToken cancellationToken);
}

public sealed class UserInvitationFlowService(
    IUserInvitationRepository invitations,
    IAuthSignInRoutingService routingService,
    TimeProvider timeProvider) : IUserInvitationFlowService
{
    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<InvitationPublicValidationResult> ValidateTokenPublicAsync(
        string invitationToken,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? invitation = await ResolveAnyByTokenAsync(invitationToken, cancellationToken)
            .ConfigureAwait(false);

        if (invitation is null)
        {
            return Invalid();
        }

        if (invitation.Status == UserInvitationStatus.Revoked)
        {
            return new InvitationPublicValidationResult { Status = InvitationPublicStatus.Revoked };
        }

        if (invitation.Status == UserInvitationStatus.Accepted)
        {
            return new InvitationPublicValidationResult { Status = InvitationPublicStatus.Accepted };
        }

        if (invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            return new InvitationPublicValidationResult { Status = InvitationPublicStatus.Expired };
        }

        AuthSignInRoutingEvaluation routing = await _routingService.EvaluateAsync(
            new AuthSignInRoutingRequest
            {
                NormalizedEmail = invitation.Email,
                InvitationToken = invitationToken
            },
            cancellationToken).ConfigureAwait(false);

        return new InvitationPublicValidationResult
        {
            Status = InvitationPublicStatus.Valid,
            MaskedInvitedEmail = MaskEmail(invitation.Email),
            AllowEmailCode = routing.AllowEmailCode,
            RequireEnterpriseSso = routing.SsoRequired,
            RoutingMessage = routing.SsoRequired ? routing.CustomerMessage : null,
            AppRole = invitation.AppRole
        };
    }

    public Task<UserInvitationRecord?> ResolvePendingByTokenAsync(
        string invitationToken,
        CancellationToken cancellationToken) =>
        ResolvePendingByTokenInternalAsync(invitationToken, cancellationToken);

    private async Task<UserInvitationRecord?> ResolvePendingByTokenInternalAsync(
        string invitationToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(invitationToken))
        {
            return null;
        }

        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(invitationToken);

        UserInvitationRecord? invitation =
            await _invitations.GetPendingByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);

        return invitation;
    }

    private async Task<UserInvitationRecord?> ResolveAnyByTokenAsync(
        string invitationToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(invitationToken))
        {
            return null;
        }

        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(invitationToken);

        return await _invitations.GetByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);
    }

    private static InvitationPublicValidationResult Invalid() =>
        new() { Status = InvitationPublicStatus.Invalid };

    private static string MaskEmail(string normalizedEmail)
    {
        int at = normalizedEmail.IndexOf('@');

        if (at <= 1)
        {
            return "***";
        }

        string local = normalizedEmail[..at];
        string domain = normalizedEmail[(at + 1)..];
        string maskedLocal = local.Length <= 2
            ? $"{local[0]}*"
            : $"{local[0]}***{local[^1]}";

        return $"{maskedLocal}@{domain}";
    }
}
