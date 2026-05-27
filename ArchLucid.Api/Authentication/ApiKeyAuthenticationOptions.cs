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

    /// <summary>
    ///     UTC hard-expiry for the admin key slot. When set and the current time is past this value,
    ///     admin key authentication is rejected even if the presented key material matches.
    ///     Supports scheduled key retirement without a configuration redeploy.
    /// </summary>
    public DateTimeOffset? AdminKeyExpiresAt
    {
        get;
        set;
    }

    /// <summary>
    ///     UTC hard-expiry for the read-only key slot.
    ///     Same semantics as <see cref="AdminKeyExpiresAt" />.
    /// </summary>
    public DateTimeOffset? ReadOnlyKeyExpiresAt
    {
        get;
        set;
    }

    /// <summary>
    ///     Tenant bound to this API key (emitted as <c>tenant_id</c> claim). Required in Production when ApiKey auth is enabled.
    /// </summary>
    public Guid? TenantId
    {
        get;
        set;
    }

    /// <summary>Workspace bound to this API key (emitted as <c>workspace_id</c> claim).</summary>
    public Guid? WorkspaceId
    {
        get;
        set;
    }

    /// <summary>Project bound to this API key (emitted as <c>project_id</c> claim).</summary>
    public Guid? ProjectId
    {
        get;
        set;
    }
}
