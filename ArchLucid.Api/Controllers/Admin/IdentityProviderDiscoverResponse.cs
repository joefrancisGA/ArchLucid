namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Response from identity provider metadata discovery.</summary>
public sealed class IdentityProviderDiscoverResponse
{
    public string Protocol { get; init; } = string.Empty;

    public string? IssuerUri { get; init; }

    public string? JwksUri { get; init; }

    public IReadOnlyList<string> SigningCertificateThumbprints { get; init; } = [];

    public IReadOnlyList<string> AvailableClaimNames { get; init; } = [];

    public bool DiscoverySucceeded { get; init; }

    public string? DiagnosticSummary { get; init; }
}
