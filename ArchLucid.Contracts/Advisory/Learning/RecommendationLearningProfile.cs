using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Aggregated recommendation outcomes and derived weights for a scope.</summary>
public class RecommendationLearningProfile
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    private List<RecommendationOutcomeStats> categoryStats = [];

    public List<RecommendationOutcomeStats> CategoryStats
    {
        get => categoryStats;
        set => categoryStats = ContractCollectionDefaults.Coalesce(value);
    }

    private List<RecommendationOutcomeStats> urgencyStats = [];

    public List<RecommendationOutcomeStats> UrgencyStats
    {
        get => urgencyStats;
        set => urgencyStats = ContractCollectionDefaults.Coalesce(value);
    }

    private List<RecommendationOutcomeStats> signalTypeStats = [];

    public List<RecommendationOutcomeStats> SignalTypeStats
    {
        get => signalTypeStats;
        set => signalTypeStats = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<string, double> categoryWeights = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, double> CategoryWeights
    {
        get => categoryWeights;
        set => categoryWeights = value ?? new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
    }

    private Dictionary<string, double> urgencyWeights = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, double> UrgencyWeights
    {
        get => urgencyWeights;
        set => urgencyWeights = value ?? new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
    }

    private Dictionary<string, double> signalTypeWeights = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, double> SignalTypeWeights
    {
        get => signalTypeWeights;
        set => signalTypeWeights = value ?? new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
    }

    private List<string> notes = [];

    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }
}
