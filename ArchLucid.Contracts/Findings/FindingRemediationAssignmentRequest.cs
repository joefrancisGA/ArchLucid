namespace ArchLucid.Contracts.Findings;

/// <summary>Upsert general remediation assignment on a persisted finding row (TB-395).</summary>
public sealed class FindingRemediationAssignmentRequest
{
    public Guid RunId
    {
        get;
        init;
    }

    /// <summary>Entra object id, email, or ServiceNow/Jira user key — opaque to ArchLucid.</summary>
    public string? AssignedToUserId
    {
        get;
        init;
    }

    public DateTimeOffset? RemediationDueUtc
    {
        get;
        init;
    }
}
