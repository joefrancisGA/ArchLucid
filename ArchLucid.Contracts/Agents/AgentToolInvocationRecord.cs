namespace ArchLucid.Contracts.Agents;

/// <summary>Persisted redacted tool-invocation row for a run (TB-110 structured ledger).</summary>
public sealed class AgentToolInvocationRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string TraceId
    {
        get;
        init;
    } = string.Empty;

    public string TaskId
    {
        get;
        init;
    } = string.Empty;

    public int SortOrder
    {
        get;
        init;
    }

    public string ToolName
    {
        get;
        init;
    } = string.Empty;

    public string ArgsPreview
    {
        get;
        init;
    } = string.Empty;

    public string? ResponseSummary
    {
        get;
        init;
    }

    public string Outcome
    {
        get;
        init;
    } = string.Empty;

    public int? DurationMs
    {
        get;
        init;
    }

    public bool BlobUploadFailed
    {
        get;
        init;
    }

    public string? CompletenessNote
    {
        get;
        init;
    }

    public DateTime InvokedAtUtc
    {
        get;
        init;
    }
}
