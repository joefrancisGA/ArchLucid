using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureRecommendation
{
    public string RecommendationId
    {
        get;
        set;
    } = null!;

    public string Problem
    {
        get;
        set;
    } = null!;

    public string Evidence
    {
        get;
        set;
    } = null!;

    public string AffectedRequirementOrQualityAttribute
    {
        get;
        set;
    } = null!;

    public string ConsequenceOfInaction
    {
        get;
        set;
    } = null!;

    public string ProposedChange
    {
        get;
        set;
    } = null!;

    private List<string> alternatives = [];

    public List<string> Alternatives
    {
        get => alternatives;
        set => alternatives = ContractCollectionDefaults.Coalesce(value);
    }

    private List<RecommendationAlternative> alternativeOptions = [];

    public List<RecommendationAlternative> AlternativeOptions
    {
        get => alternativeOptions;
        set => alternativeOptions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<TradeOffObject> tradeOffs = [];

    public List<TradeOffObject> TradeOffs
    {
        get => tradeOffs;
        set => tradeOffs = ContractCollectionDefaults.Coalesce(value);
    }

    private EffortEstimate effort = new();

    public EffortEstimate Effort
    {
        get => effort;
        set => effort = value ?? new EffortEstimate();
    }

    private RiskReductionEstimate riskReduction = new();

    public RiskReductionEstimate RiskReduction
    {
        get => riskReduction;
        set => riskReduction = value ?? new RiskReductionEstimate();
    }

    private List<string> dependencies = [];

    public List<string> Dependencies
    {
        get => dependencies;
        set => dependencies = ContractCollectionDefaults.Coalesce(value);
    }

    public string ValidationMethod
    {
        get;
        set;
    } = null!;

    public double Confidence
    {
        get;
        set;
    }

    public bool? RequiresHumanApproval
    {
        get;
        set;
    }

    private ClaimProvenance provenance = new();

    public ClaimProvenance Provenance
    {
        get => provenance;
        set => provenance = value ?? new ClaimProvenance();
    }
}
