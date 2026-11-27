namespace ArchLucid.Core.Configuration;

using ArchLucid.Core.Integrations.Itsm;

/// <summary>ServiceNow Table API — instance URL + basic auth or OAuth client-credentials (TB-600).</summary>
public sealed class ServiceNowItsmOutboundOptions
{
    /// <summary>E.g. <c>https://your-instance.service-now.com</c> (no trailing path).</summary>
    public string InstanceBaseUrl { get; set; } = string.Empty;

    public ItsmConnectorAuthMode AuthMode { get; set; } = ItsmConnectorAuthMode.BasicApiToken;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string OAuthClientId { get; set; } = string.Empty;

    public string OAuthClientSecret { get; set; } = string.Empty;
}
