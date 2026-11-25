using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureRecommendation
{
    private string recommendationId = string.Empty;

    public string RecommendationId
    {
        get => recommendationId;
        set => recommendationId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string problem = string.Empty;

    public string Problem
    {
        get => problem;
        set => problem = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string evidence = string.Empty;

    public string Evidence
    {
        get => evidence;
        set => evidence = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string affectedRequirementOrQualityAttribute = string.Empty;

    public string AffectedRequirementOrQualityAttribute
    {
        get => affectedRequirementOrQualityAttribute;
        set => affectedRequirementOrQualityAttribute = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string consequenceOfInaction = string.Empty;

    public string ConsequenceOfInaction
    {
        get => consequenceOfInaction;
        set => consequenceOfInaction = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string proposedChange = string.Empty;

    public string ProposedChange
    {
        get => proposedChange;
        set => proposedChange = ContractCollectionDefaults.CoalesceRequired(value);
    }

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

    private string validationMethod = string.Empty;

    public string ValidationMethod
    {
        get => validationMethod;
        set => validationMethod = ContractCollectionDefaults.CoalesceRequired(value);
    }

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
