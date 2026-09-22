using System.Globalization;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Deterministic prose for path rank GET responses (SA-09).</summary>
public static class SecurityEvidencePathRankExplanationBuilder
{
    public static string BuildSummary(
        SecurityEvidencePathRecord path,
        decimal technicalExposure,
        decimal privilegeDepth,
        decimal blastRadius,
        decimal? businessConsequence,
        decimal confidenceBand,
        decimal compositeSortScore)
    {
        string consequencePhrase = businessConsequence is null
            ? "business consequence is Unknown (neutral in sort; technical dimensions still apply)"
            : $"business consequence score {FormatScore(businessConsequence.Value)} from asserted crown-jewel linkage";

        return $"{SecurityEvidencePathRankConstants.RuleVersion}: {path.PathKind} path ranks by weighted dimensions — "
            + $"technical exposure {FormatScore(technicalExposure)}, "
            + $"privilege depth {FormatScore(privilegeDepth)}, "
            + $"blast radius {FormatScore(blastRadius)}, "
            + $"{consequencePhrase}, "
            + $"confidence {FormatScore(confidenceBand)} ({path.PathConfidenceBand}); "
            + $"composite sort {FormatScore(compositeSortScore)}.";
    }

    public static SecurityEvidencePathRankProse BuildDimensionProse(
        SecurityEvidencePathRecord path,
        SecurityEvidencePathRankRecord rank)
    {
        string technical =
            $"Technical exposure {FormatScore(rank.TechnicalExposureScore)} of {FormatScore(SecurityEvidencePathRankConstants.DimensionCap)} "
            + $"from network and path-kind signals on {path.PathKind}.";

        string privilege =
            $"Privilege depth {FormatScore(rank.PrivilegeDepthScore)} of {FormatScore(SecurityEvidencePathRankConstants.DimensionCap)} "
            + $"from role, read/write, and identity hops.";

        string blast = BuildBlastRadiusProse(rank);

        string consequence;

        if (rank.BusinessConsequenceScore is null)
        {
            consequence =
                "Business consequence is Unknown because no crown-jewel assertion is linked; "
                + $"sort uses neutral {FormatScore(SecurityEvidencePathRankConstants.NeutralBusinessConsequenceScore)} "
                + "so technical exposure is not zeroed.";
        }
        else
        {
            consequence =
                $"Business consequence {FormatScore(rank.BusinessConsequenceScore.Value)} of {FormatScore(SecurityEvidencePathRankConstants.DimensionCap)} "
                + "from an asserted crown-jewel linkage.";
        }

        string confidence =
            $"Confidence band {FormatScore(rank.ConfidenceBandScore)} of {FormatScore(SecurityEvidencePathRankConstants.DimensionCap)} "
            + $"maps path band {path.PathConfidenceBand} (stronger evidence scores higher).";

        return new SecurityEvidencePathRankProse
        {
            TechnicalExposure = technical,
            PrivilegeDepth = privilege,
            BlastRadius = blast,
            BusinessConsequence = consequence,
            ConfidenceBand = confidence,
            Overall = rank.ExplanationSummary,
        };
    }

    private static string FormatScore(decimal score) =>
        score.ToString("0.##", CultureInfo.InvariantCulture);

    private static string BuildBlastRadiusProse(SecurityEvidencePathRankRecord rank)
    {
        string prose =
            $"Blast radius {FormatScore(rank.BlastRadiusScore)} of {FormatScore(SecurityEvidencePathRankConstants.DimensionCap)} "
            + "from downstream resource fan-out and shared-control patterns.";

        string? defenderPostureBand =
            SecurityEvidencePathRankBreakdownReader.TryReadDefenderPostureBandLabel(rank.BreakdownJson);

        if (defenderPostureBand is null)
        {
            return prose;
        }

        return prose
            + $" Subscription Defender posture band is {defenderPostureBand} (ordinal metadata only; no percentage score).";
    }
}

public sealed class SecurityEvidencePathRankProse
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
