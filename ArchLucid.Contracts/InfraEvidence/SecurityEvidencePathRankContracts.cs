namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityEvidencePathRankSummaryResponse
{
    public Guid PathId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public int RankOrder
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

    public decimal CompositeSortScore
    {
        get;
        init;
    }

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string PathKind
    {
        get;
        init;
    } = string.Empty;

    public string PathConfidenceBand
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

public sealed class SecurityEvidencePathRankDetailResponse
{
    public Guid PathId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public int RankOrder
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

    public decimal CompositeSortScore
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

    public string PathKind
    {
        get;
        init;
    } = string.Empty;

    public string PathConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public SecurityEvidencePathRankDimensionProseResponse DimensionProse
    {
        get;
        init;
    } = new();

    public DateTime ComputedUtc
    {
        get;
        init;
    }
}

public sealed class SecurityEvidencePathRankDimensionProseResponse
{
    public string TechnicalExposure
    {
        get;
        init;
    } = string.Empty;

    public string PrivilegeDepth
    {
        get;
        init;
    } = string.Empty;

    public string BlastRadius
    {
        get;
        init;
    } = string.Empty;

    public string BusinessConsequence
    {
        get;
        init;
    } = string.Empty;

    public string ConfidenceBand
    {
        get;
        init;
    } = string.Empty;

    public string Overall
    {
        get;
        init;
    } = string.Empty;
}
