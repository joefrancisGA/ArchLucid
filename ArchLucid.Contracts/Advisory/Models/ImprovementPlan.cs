namespace ArchLucid.Contracts.Advisory.Models;

public class ImprovementPlan
{
    public Guid RunId
    {
        get;
        set;
    }

    public Guid? ComparedToRunId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public List<ImprovementRecommendation> Recommendations
    {
        get;
        set;
    } = [];

    public List<string> SummaryNotes
    {
        get;
        set;
    } = [];

    public Dictionary<string, string> PolicyPackAdvisoryDefaults
    {
        get;
        set;
    } =
        new(StringComparer.OrdinalIgnoreCase);
}
