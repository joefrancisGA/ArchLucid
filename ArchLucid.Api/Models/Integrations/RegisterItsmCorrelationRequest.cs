namespace ArchLucid.Api.Models.Integrations;

/// <summary>Registers or idempotently reaffirms an ITSM external ticket correlation for a finding.</summary>
public sealed class RegisterItsmCorrelationRequest
{
    public string FindingId
    {
        get;
        set;
    } = null!;

    /// <summary><c>Jira</c> or <c>ServiceNow</c> (case-insensitive).</summary>
    public string Provider
    {
        get;
        set;
    } = null!;

    /// <summary>Jira issue key (e.g. PROJ-123) or ServiceNow incident number / sys_id stored as external key.</summary>
    public string ExternalKey
    {
        get;
        set;
    } = null!;

    public string? ExternalSysId
    {
        get;
        set;
    }
}
