namespace ArchLucid.Core.Configuration;

/// <summary>First-party ITSM integration posture (see <c>Integrations:Itsm</c>).</summary>
public sealed class IntegrationsItsmOptions
{
    public const string SectionName = "Integrations:Itsm";

    /// <summary>
    /// When <see langword="true"/> (V1 GA default), one-click outbound Jira/ServiceNow create is enabled once
    /// deployment credentials are configured. Set <see langword="false"/> to return <c>404</c> from outbound create
    /// while copy-as-work-item and correlation register APIs remain available.
    /// </summary>
    public bool NativeEnabled { get; set; } = true;
}
