namespace ArchLucid.Core.InfraEvidence;

/// <summary>SA-09 path ranking defaults — not a multiplicative risk percentage.</summary>
public static class SecurityEvidencePathRankConstants
{
    public const string RuleVersion = "SA09-rank-v1";

    /// <summary>Each dimension is capped at this value (documented in SECURENOW_PATH_RANKING.md).</summary>
    public const decimal DimensionCap = 4m;

    /// <summary>
    ///     Neutral business-consequence contribution when CrownJewelAssertionId is absent.
    ///     Unknown must not zero the composite sort key.
    /// </summary>
    public const decimal NeutralBusinessConsequenceScore = 2m;

    public static IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> DefaultWeights() =>
        new Dictionary<SecurityEvidencePathRankDimension, decimal>
        {
            [SecurityEvidencePathRankDimension.TechnicalExposure] = 0.25m,
            [SecurityEvidencePathRankDimension.PrivilegeDepth] = 0.20m,
            [SecurityEvidencePathRankDimension.BlastRadius] = 0.20m,
            [SecurityEvidencePathRankDimension.BusinessConsequence] = 0.15m,
            [SecurityEvidencePathRankDimension.ConfidenceBand] = 0.20m,
        };
}
