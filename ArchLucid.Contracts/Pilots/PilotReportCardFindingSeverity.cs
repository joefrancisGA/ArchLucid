namespace ArchLucid.Contracts.Pilots;

/// <summary>Count of persisted architecture findings grouped by relational <c>Severity</c> label.</summary>
public sealed class PilotReportCardFindingSeverity
{
    public required string Severity
    {
        get;
        init;
    }

    public int Count
    {
        get;
        init;
    }
}
