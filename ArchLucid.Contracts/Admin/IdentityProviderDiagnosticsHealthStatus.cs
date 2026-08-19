namespace ArchLucid.Contracts.Admin;

/// <summary>Operator-facing health labels for identity provider diagnostics probes.</summary>
public static class IdentityProviderDiagnosticsHealthStatus
{
    public const string Healthy = "Healthy";

    public const string Degraded = "Degraded";

    public const string Unreachable = "Unreachable";

    public const string NotApplicable = "NotApplicable";
}
