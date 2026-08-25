using ArchLucid.Core.Authorization;

namespace ArchLucid.Application.Identity;

public enum EmailOtpAuthNextStep
{
    SelectWorkspace = 0,
    AcceptInvitation = 1,
    CreateWorkspace = 2,
    Complete = 3
}

public sealed class EmailOtpChallengeRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ClientIp
    {
        get;
        init;
    }

    public string? UserAgent
    {
        get;
        init;
    }

    public string? BotChallengeToken
    {
        get;
        init;
    }
}

public sealed class EmailOtpChallengeRequestResult
{
    public string Message
    {
        get;
        init;
    } = "If that address can receive email, we sent a sign-in code.";

    public Guid? ChallengeId
    {
        get;
        init;
    }

    public bool SsoRequired
    {
        get;
        init;
    }

    public string? SsoMessage
    {
        get;
        init;
    }

    public bool? EmailDeliverySucceeded
    {
        get;
        init;
    }
}

public sealed class EmailOtpVerifyRequest
{
    public Guid ChallengeId
    {
        get;
        init;
    }

    public string Code
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }
}

public sealed class AcceptedEmailOtpInvitation
{
    public Guid InvitationId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }
}

public sealed class EmailOtpVerifyResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? PlatformUserId
    {
        get;
        init;
    }

    public string? DisplayEmail
    {
        get;
        init;
    }

    public string Role
    {
        get;
        init;
    } = ArchLucidRoles.Reader;

    public EmailOtpAuthNextStep NextStep
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? WorkspaceId
    {
        get;
        init;
    }

    public Guid? InvitationId
    {
        get;
        init;
    }

    public Guid AuthVersion
    {
        get;
        init;
    }

    public string FailureMessage
    {
        get;
        init;
    } = "Invalid or expired sign-in code.";
}

public interface IEmailOtpAuthService
{
    Task<EmailOtpChallengeRequestResult> RequestCodeAsync(
        EmailOtpChallengeRequest request,
        CancellationToken cancellationToken);

    Task<EmailOtpVerifyResult> VerifyCodeAsync(
        EmailOtpVerifyRequest request,
        CancellationToken cancellationToken);
}
