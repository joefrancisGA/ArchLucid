namespace ArchLucid.Api.Models.Auth;

public sealed class TrialLocalRegisterRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Password
    {
        get;
        set;
    }
}

public sealed class TrialLocalVerifyEmailRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Token
    {
        get;
        set;
    }
}

public sealed class TrialLocalTokenRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Password
    {
        get;
        set;
    }

    public Guid? TenantId
    {
        get;
        set;
    }

    public Guid? WorkspaceId
    {
        get;
        set;
    }

    public Guid? ProjectId
    {
        get;
        set;
    }
}

public sealed class TrialLocalRegisterResponse
{
    public Guid UserId
    {
        get;
        set;
    }

    public string VerificationToken
    {
        get;
        set;
    } = string.Empty;
}

public sealed class TrialLocalTokenResponse
{
    public string AccessToken
    {
        get;
        set;
    } = string.Empty;

    public string TokenType
    {
        get;
        set;
    } = "Bearer";

    public int ExpiresInSeconds
    {
        get;
        set;
    }
}
