namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathRankRecord
{
    public Guid PathId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string RuleVersion
    {
        get;
        init;
    } = string.Empty;

    public decimal TechnicalExposureScore
    {
        get;
        init;
    }

    public decimal PrivilegeDepthScore
    {
        get;
        init;
    }

    public decimal BlastRadiusScore
    {
        get;
        init;
    }

    /// <summary>Null when business consequence is Unknown (no crown-jewel assertion).</summary>
    public decimal? BusinessConsequenceScore
    {
        get;
        init;
    }

    public decimal ConfidenceBandScore
    {
        get;
        init;
    }

    /// <summary>Weighted sum used for ordering; uses neutral consequence when BusinessConsequenceScore is null.</summary>
    public decimal CompositeSortScore
    {
        get;
        init;
    }

    public int RankOrder
    {
        get;
        init;
    }

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string BreakdownJson
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
