namespace ArchLucid.Core.Configuration;

/// <summary>First-party ITSM integration posture (see <c>Integrations:Itsm</c>).</summary>
public sealed class IntegrationsItsmOptions
{
    public const string SectionName = "Integrations:Itsm";

    /// <summary>
    /// When <see langword="false"/> (V1 GA default), one-click outbound Jira/ServiceNow create is disabled while
    /// manual copy-as-work-item and correlation register APIs remain available.
    /// </summary>
    public bool NativeEnabled { get; set; }
}
