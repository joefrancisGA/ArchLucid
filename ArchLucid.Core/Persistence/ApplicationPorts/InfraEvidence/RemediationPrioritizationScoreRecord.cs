namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationPrioritizationScoreRecord
{
    public Guid FindingId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public decimal TotalScore
    {
        get;
        init;
    }

    public string BreakdownJson
    {
        get;
        init;
    } = string.Empty;

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string RuleVersion
    {
        get;
        init;
    } = string.Empty;

    public DateTime ComputedUtc
    {
        get;
        init;
    }
}
