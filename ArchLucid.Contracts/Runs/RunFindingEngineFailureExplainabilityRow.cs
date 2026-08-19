namespace ArchLucid.Contracts.Runs;

/// <summary>Finding-engine failure row on unified run decision explainability (TB-056 / TB-054).</summary>
public sealed class RunFindingEngineFailureExplainabilityRow
{
    public string EngineType
    {
        get;
        set;
    } = string.Empty;

    public string Category
    {
        get;
        set;
    } = string.Empty;

    public string ExceptionType
    {
        get;
        set;
    } = string.Empty;

    public string ErrorMessage
    {
        get;
        set;
    } = string.Empty;

    public long DurationMs
    {
        get;
        set;
    }

    public DateTime OccurredUtc
    {
        get;
        set;
    }
}
