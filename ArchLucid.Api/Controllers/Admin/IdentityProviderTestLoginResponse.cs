namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Response from sandbox SSO test login.</summary>
public sealed class IdentityProviderTestLoginResponse
{
    public bool Success { get; init; }

    public IReadOnlyList<string> MappedRoles { get; init; } = [];

    /// <summary>Short-lived preview bearer token (wizard sandbox only — not accepted by live API auth).</summary>
    public string? AccessToken { get; init; }

    public int ExpiresInSeconds { get; init; }

    public string? DiagnosticSummary { get; init; }
}
