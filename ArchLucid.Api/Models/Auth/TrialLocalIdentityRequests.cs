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

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
    public Guid? TenantId
    {
        get;
        set;
    }

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
    public Guid? WorkspaceId
    {
        get;
        set;
    }

    /// <summary>Ignored for token issuance — scope is fixed to platform defaults (TB-274).</summary>
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
