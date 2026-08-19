namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Redacted per-LLM-call forensic row derived from persisted <see cref="AgentExecutionTrace" /> rows (TB-110).
///     Not a structured MCP/tool-call ledger until tool invocations are persisted separately.
/// </summary>
public sealed class RunToolInvocationForensicRow
{
    public string TraceId
    {
        get;
        set;
    } = string.Empty;

    public string TaskId
    {
        get;
        set;
    } = string.Empty;

    public string AgentType
    {
        get;
        set;
    } = string.Empty;

    public string ToolName
    {
        get;
        set;
    } = string.Empty;

    public string ArgsPreview
    {
        get;
        set;
    } = string.Empty;

    public string Outcome
    {
        get;
        set;
    } = string.Empty;

    public int? DurationMs
    {
        get;
        set;
    }

    public bool BlobUploadFailed
    {
        get;
        set;
    }

    public string? CompletenessNote
    {
        get;
        set;
    }

    public DateTime InvokedAtUtc
    {
        get;
        set;
    }
}
