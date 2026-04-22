namespace ArchLucid.Api.Authentication;

/// <summary>
///     API key material and feature flags under <c>Authentication:ApiKey</c>.
///     Bound with <see cref="Microsoft.Extensions.Options.IOptionsMonitor{TOptions}" /> so key rotation via configuration
///     reload
///     (e.g. Key Vault refresh) is visible without process restart.
/// </summary>
public sealed class ApiKeyAuthenticationOptions
{
    /// <summary>Configuration section path (<c>Authentication:ApiKey</c>).</summary>
    public const string SectionPath = "Authentication:ApiKey";

    /// <summary>When false, authentication fails closed unless <see cref="DevelopmentBypassAll" /> applies.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Non-production only: synthetic admin principal when <see cref="Enabled" /> is false.</summary>
    public bool DevelopmentBypassAll
    {
        get;
        set;
    }

    /// <summary>Comma-separated acceptable admin key segments (trimmed); supports overlap rotation.</summary>
    public string? AdminKey
    {
        get;
        set;
    }

    /// <summary>Comma-separated acceptable read-only key segments.</summary>
    public string? ReadOnlyKey
    {
        get;
        set;
    }
}
