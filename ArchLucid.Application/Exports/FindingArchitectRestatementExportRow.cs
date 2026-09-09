namespace ArchLucid.Application.Exports;

/// <summary>One architect restatement row for sponsor/receipt human-judgment export sections (LP-15).</summary>
public sealed class FindingArchitectRestatementExportRow
{
    public string FindingId
    {
        get;
        init;
    } = string.Empty;

    public string? FindingTitle
    {
        get;
        init;
    }

    public string Restatement
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset OccurredAtUtc
    {
        get;
        init;
    }

    /// <summary><see langword="true" /> when sourced from a durable disposition audit-trail event.</summary>
    public bool IsTrailBacked
    {
        get;
        init;
    }
}
