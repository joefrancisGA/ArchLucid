namespace ArchLucid.Contracts.Governance;

/// <summary>
/// One append-only row in <c>dbo.PolicyPackChangeLog</c> describing a policy pack–related mutation.
/// </summary>
public sealed class PolicyPackChangeLogEntry
{
    /// <summary>Surrogate key; populated by the store on insert when not supplied.</summary>
    public Guid ChangeLogId
    {
        get; init;
    }

    public Guid PolicyPackId
    {
        get; init;
    }

    public Guid TenantId
    {
        get; init;
    }

    public Guid WorkspaceId
    {
        get; init;
    }

    public Guid ProjectId
    {
        get; init;
    }

    /// <summary>Logical change category (see <c>PolicyPackChangeTypes</c> in Decisioning).</summary>
    public string ChangeType { get; init; } = string.Empty;

    public string ChangedBy { get; init; } = string.Empty;

    public DateTime ChangedUtc
    {
        get; init;
    }

    public string? PreviousValue
    {
        get; init;
    }

    public string? NewValue
    {
        get; init;
    }

    public string? SummaryText
    {
        get; init;
    }
}
