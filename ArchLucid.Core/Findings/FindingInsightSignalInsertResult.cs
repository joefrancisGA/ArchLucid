namespace ArchLucid.Core.Findings;

public sealed class FindingInsightSignalInsertResult
{
    public Guid SignalId
    {
        get;
        init;
    }

    public bool Created
    {
        get;
        init;
    }
}
