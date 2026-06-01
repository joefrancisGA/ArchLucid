namespace ArchLucid.Contracts.Agents;

/// <summary>Trace-derived invocation forensics for one architecture run (TB-110).</summary>
public sealed class RunToolInvocationForensicsResponse
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public bool HasStructuredToolCallLog
    {
        get;
        set;
    }

    public bool HasTraceBlobPersistenceFailure
    {
        get;
        set;
    }

    public string CompletenessDisclaimer
    {
        get;
        set;
    } = string.Empty;

    public IReadOnlyList<RunToolInvocationForensicRow> Rows
    {
        get;
        set;
    } = Array.Empty<RunToolInvocationForensicRow>();
}
