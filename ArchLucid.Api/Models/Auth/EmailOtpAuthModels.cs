namespace ArchLucid.Api.Models.Auth;

public sealed class EmailOtpChallengeRequest
{
    public string? Email
    {
        get;
        init;
    }

    public string? InvitationToken
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

public sealed class EmailOtpChallengeResponse
{
    public string Message
    {
        get;
        init;
    } = string.Empty;

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

    public string? Code
    {
        get;
        init;
    }

    public string? InvitationToken
    {
        get;
        init;
    }
}

public sealed class EmailOtpVerifyResponse
{
    public string AccessToken
    {
        get;
        init;
    } = string.Empty;

    public string TokenType
    {
        get;
        init;
    } = "Bearer";

    public int ExpiresInSeconds
    {
        get;
        init;
    }

    public Guid PlatformUserId
    {
        get;
        init;
    }

    public string NextStep
    {
        get;
        init;
    } = string.Empty;

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
}
