namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>
///     Coordinator run event (options evaluated, merges applied, etc.); carried on <see cref="RunEventTraceDto.RunEvent" />.
/// </summary>
public sealed class RunEventTracePayload
{
    public string TraceId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string EventType
    {
        get;
        set;
    } = string.Empty;

    public string EventDescription
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public Dictionary<string, string> Metadata
    {
        get;
        set;
    } = [];
}
