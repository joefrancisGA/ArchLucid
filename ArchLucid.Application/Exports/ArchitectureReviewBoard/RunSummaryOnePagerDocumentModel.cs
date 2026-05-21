namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Handlebars model for <c>run-summary-one-pager.md.hbs</c>.</summary>
public sealed class RunSummaryOnePagerDocumentModel
{
    public string RunId
    {
        get;
        init;
    } = "";

    public string? SystemName
    {
        get;
        init;
    }

    public int CriticalCount
    {
        get;
        init;
    }

    public int HighCount
    {
        get;
        init;
    }

    public int MediumCount
    {
        get;
        init;
    }

    public int LowCount
    {
        get;
        init;
    }

    public string ExecutiveSummary
    {
        get;
        init;
    } = "";

    public IReadOnlyList<string> TopFindingTitles
    {
        get;
        init;
    } = [];
}
