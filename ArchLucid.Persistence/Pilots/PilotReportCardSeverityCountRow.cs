namespace ArchLucid.Persistence.Pilots;

/// <summary>Dapper row projection for relational finding severity aggregates.</summary>
public sealed class PilotReportCardSeverityCountRow
{
    public string Severity
    {
        get;
        init;
    } = "";

    public long SeverityBucketCount
    {
        get;
        init;
    }
}
