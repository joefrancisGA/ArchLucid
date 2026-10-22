namespace ArchLucid.Core.Http;

/// <summary>
///     Canonical outbound <see cref="System.Net.Http.HttpClient.Timeout" /> values (seconds) for registered factory clients.
/// </summary>
public static class OutboundHttpClientTimeoutSeconds
{
    /// <summary>Loopback probes, OIDC/SAML metadata, and other fast internal diagnostics.</summary>
    public const int InternalDiagnostics = 10;

    /// <summary>Internal loopback health probes against the local Kestrel host.</summary>
    public const int InternalLoopbackProbe = 15;

    /// <summary>External REST integrations with moderate payloads (publishers, billing, password breach checks).</summary>
    public const int ExternalIntegration = 30;

    /// <summary>DevOps / ITSM-style integrations that may wait on upstream workflow APIs.</summary>
    public const int DevOpsIntegration = 60;
}
