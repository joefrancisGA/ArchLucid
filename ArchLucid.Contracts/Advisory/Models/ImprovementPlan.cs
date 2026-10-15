using ArchLucid.Contracts.Serialization;

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

    private List<ImprovementRecommendation> recommendations = [];

    public List<ImprovementRecommendation> Recommendations
    {
        get => recommendations;
        set => recommendations = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> summaryNotes = [];

    public List<string> SummaryNotes
    {
        get => summaryNotes;
        set => summaryNotes = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<string, string> policyPackAdvisoryDefaults = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> PolicyPackAdvisoryDefaults
    {
        get => policyPackAdvisoryDefaults;
        set => policyPackAdvisoryDefaults = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}
