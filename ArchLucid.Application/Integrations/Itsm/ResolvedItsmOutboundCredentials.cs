using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Resolved outbound ITSM credentials for one vendor call (never log secret fields).</summary>
public sealed record ResolvedItsmOutboundCredentials
{
    public required string InstanceBaseUrl
    {
        get;
        init;
    }

    public ItsmConnectorAuthMode AuthMode
    {
        get;
        init;
    } = ItsmConnectorAuthMode.BasicApiToken;

    public string? BasicAuthUserName
    {
        get;
        init;
    }

    public string? BasicSecretValue
    {
        get;
        init;
    }

    public string? OAuthClientId
    {
        get;
        init;
    }

    public string? OAuthClientSecret
    {
        get;
        init;
    }

    public string? OAuthRefreshToken
    {
        get;
        init;
    }

    public bool FromTenantConnection
    {
        get;
        init;
    }

    /// <summary>Legacy accessor for basic-auth call sites.</summary>
    public string AuthUserName => BasicAuthUserName ?? "";

    /// <summary>Legacy accessor for basic-auth call sites.</summary>
    public string SecretValue => BasicSecretValue ?? "";

    public static ResolvedItsmOutboundCredentials ForBasic(
        string instanceBaseUrl,
        string authUserName,
        string secretValue,
        bool fromTenantConnection) =>
        new()
        {
            InstanceBaseUrl = instanceBaseUrl,
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            BasicAuthUserName = authUserName,
            BasicSecretValue = secretValue,
            FromTenantConnection = fromTenantConnection
        };

    public static ResolvedItsmOutboundCredentials ForOAuth(
        string instanceBaseUrl,
        ItsmConnectorAuthMode authMode,
        string oauthClientId,
        string oauthClientSecret,
        string? oauthRefreshToken,
        bool fromTenantConnection) =>
        new()
        {
            InstanceBaseUrl = instanceBaseUrl,
            AuthMode = authMode,
            OAuthClientId = oauthClientId,
            OAuthClientSecret = oauthClientSecret,
            OAuthRefreshToken = oauthRefreshToken,
            FromTenantConnection = fromTenantConnection
        };
}
