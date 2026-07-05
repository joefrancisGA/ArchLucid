namespace ArchLucid.Application.Integrations.Itsm.OAuth;

/// <summary>OAuth token endpoint response used by ITSM connector outbound auth (TB-600).</summary>
public sealed class ItsmConnectorOAuthTokenExchangeResult
{
    public required string AccessToken
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresAtUtc
    {
        get;
        init;
    }
}
