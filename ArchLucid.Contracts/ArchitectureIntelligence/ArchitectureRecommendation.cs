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

    public List<string> Alternatives
    {
        get;
        set;
    } = [];

    public List<RecommendationAlternative> AlternativeOptions
    {
        get;
        set;
    } = [];

    public List<TradeOffObject> TradeOffs
    {
        get;
        set;
    } = [];

    public EffortEstimate Effort
    {
        get;
        set;
    } = new();

    public RiskReductionEstimate RiskReduction
    {
        get;
        set;
    } = new();

    public List<string> Dependencies
    {
        get;
        set;
    } = [];

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

    public bool RequiresHumanApproval
    {
        get;
        set;
    }

    public ClaimProvenance Provenance
    {
        get;
        set;
    } = new();
}
