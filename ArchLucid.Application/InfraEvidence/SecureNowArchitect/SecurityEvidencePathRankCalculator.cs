using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecurityEvidencePathRankDimensionContribution
{
    public SecurityEvidencePathRankDimension Dimension
    {
        get;
        init;
    }

    public decimal RawScore
    {
        get;
        init;
    }

    public decimal Weight
    {
        get;
        init;
    }

    public decimal WeightedContribution
    {
        get;
        init;
    }

    public string Source
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityEvidencePathRankEvaluation
{
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

    public IReadOnlyList<SecurityEvidencePathRankDimensionContribution> Contributions
    {
        get;
        init;
    } = [];

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
}

/// <summary>Deterministic path ranking (SA-09) — no LLM, no multiplicative magic score.</summary>
public static class SecurityEvidencePathRankCalculator
{
    public static SecurityEvidencePathRankEvaluation Evaluate(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal>? weights = null,
        IReadOnlySet<Guid>? activeCrownJewelAssertionIds = null)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);

        IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> effectiveWeights =
            weights ?? SecurityEvidencePathRankConstants.DefaultWeights();

        decimal technicalExposure = Cap(ScoreTechnicalExposure(path, hops));
        decimal privilegeDepth = Cap(ScorePrivilegeDepth(path, hops));
        decimal blastRadius = Cap(ScoreBlastRadius(path, hops));
        (decimal? businessConsequence, string businessSource) =
            ScoreBusinessConsequence(path, activeCrownJewelAssertionIds);
        decimal confidenceBand = Cap(ScoreConfidenceBand(path.PathConfidenceBand));

        List<SecurityEvidencePathRankDimensionContribution> contributions = [];

        AddContribution(
            contributions,
            SecurityEvidencePathRankDimension.TechnicalExposure,
            effectiveWeights,
            technicalExposure,
            DescribeTechnicalExposure(path, hops));

        AddContribution(
            contributions,
            SecurityEvidencePathRankDimension.PrivilegeDepth,
            effectiveWeights,
            privilegeDepth,
            DescribePrivilegeDepth(hops));

        AddContribution(
            contributions,
            SecurityEvidencePathRankDimension.BlastRadius,
            effectiveWeights,
            blastRadius,
            DescribeBlastRadius(path, hops));

        decimal consequenceForSort = businessConsequence ?? SecurityEvidencePathRankConstants.NeutralBusinessConsequenceScore;

        AddContribution(
            contributions,
            SecurityEvidencePathRankDimension.BusinessConsequence,
            effectiveWeights,
            consequenceForSort,
            businessSource);

        AddContribution(
            contributions,
            SecurityEvidencePathRankDimension.ConfidenceBand,
            effectiveWeights,
            confidenceBand,
            path.PathConfidenceBand.ToString());

        decimal composite = contributions.Sum(item => item.WeightedContribution);

        string explanationSummary = SecurityEvidencePathRankExplanationBuilder.BuildSummary(
            path,
            technicalExposure,
            privilegeDepth,
            blastRadius,
            businessConsequence,
            confidenceBand,
            composite);

        string breakdownJson = JsonSerializer.Serialize(
            contributions.Select(item => new
            {
                dimension = item.Dimension.ToString(),
                rawScore = item.RawScore,
                weight = item.Weight,
                weightedContribution = item.WeightedContribution,
                source = item.Source,
            }),
            new JsonSerializerOptions { WriteIndented = false });

        return new SecurityEvidencePathRankEvaluation
        {
            TechnicalExposureScore = technicalExposure,
            PrivilegeDepthScore = privilegeDepth,
            BlastRadiusScore = blastRadius,
            BusinessConsequenceScore = businessConsequence,
            ConfidenceBandScore = confidenceBand,
            CompositeSortScore = composite,
            Contributions = contributions,
            ExplanationSummary = explanationSummary,
            BreakdownJson = breakdownJson,
        };
    }

    public static IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> ParseWeightsJson(string? weightsJson)
    {
        if (string.IsNullOrWhiteSpace(weightsJson))
        {
            return SecurityEvidencePathRankConstants.DefaultWeights();
        }

        try
        {
            Dictionary<string, decimal>? parsed = JsonSerializer.Deserialize<Dictionary<string, decimal>>(weightsJson);

            if (parsed is null || parsed.Count == 0)
            {
                return SecurityEvidencePathRankConstants.DefaultWeights();
            }

            Dictionary<SecurityEvidencePathRankDimension, decimal> resolved = new();

            foreach (KeyValuePair<string, decimal> entry in parsed)
            {

                if (Enum.TryParse(entry.Key, ignoreCase: true, out SecurityEvidencePathRankDimension dimension))
                {
                    resolved[dimension] = entry.Value;
                }
            }

            if (resolved.Count == 0)
            {
                return SecurityEvidencePathRankConstants.DefaultWeights();
            }

            IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> defaults =
                SecurityEvidencePathRankConstants.DefaultWeights();

            foreach (KeyValuePair<SecurityEvidencePathRankDimension, decimal> fallback in defaults)
            {

                if (!resolved.ContainsKey(fallback.Key))
                {
                    resolved[fallback.Key] = fallback.Value;
                }
            }

            return resolved;
        }
        catch (JsonException)
        {
            return SecurityEvidencePathRankConstants.DefaultWeights();
        }
    }

    private static decimal ScoreTechnicalExposure(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        decimal score = 0m;
        bool hasPublicExposure = hops.Any(hop =>
            hop.FromNodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal)
            || hop.EdgeType.Equals(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase));

        if (hasPublicExposure)
        {
            score += 2.5m;
        }

        bool hasEgress = hops.Any(hop =>
            hop.ToNodeId.Equals(SecureNowArchitectConstants.InternetEgressNodeId, StringComparison.Ordinal)
            || hop.EdgeType.Equals(SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType, StringComparison.OrdinalIgnoreCase));

        if (hasEgress)
        {
            score += 1.0m;
        }

        if (path.PathKind is PathKind.IntendedReachability or PathKind.ToxicCombination)
        {
            score += 0.5m;
        }

        if (path.PathKind is PathKind.CapabilityToFlow)
        {
            score += 0.75m;
        }

        if (path.PathKind is PathKind.Privilege && !hasPublicExposure && !hasEgress)
        {
            score = Math.Max(score, 1.0m);
        }

        return score;
    }

    private static decimal ScorePrivilegeDepth(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        decimal score = 0m;

        foreach (SecurityEvidencePathHopRecord hop in hops)
        {

            if (hop.EdgeType.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
            {
                score += 1.5m;
            }
            else if (hop.EdgeType.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
            {
                score += 0.5m;
            }
            else if (hop.EdgeType.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase))
            {
                score += 1.0m;
            }
            else if (hop.EdgeType.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
            {
                score += 0.25m;
            }
        }

        if (path.PathKind == PathKind.Privilege)
        {
            score += 0.5m;
        }

        if (path.PathKind == PathKind.ToxicCombination)
        {
            score += 0.25m;
        }

        return score;
    }

    private static decimal ScoreBlastRadius(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        if (path.PathKind == PathKind.SharedControlBlastRadius)
        {
            return 3.5m;
        }

        int distinctResources = hops
            .Where(hop => hop.CloudResourceId is not null)
            .Select(hop => hop.CloudResourceId!.Value)
            .Distinct()
            .Count();

        decimal score = Math.Min(2.0m, distinctResources * 0.5m);

        if (hops.Any(hop =>
                hop.EdgeType.Equals(SecureNowArchitectConstants.SharedControlFanOutHopEdgeType, StringComparison.OrdinalIgnoreCase)))
        {
            score += 1.5m;
        }

        if (path.PathKind == PathKind.ToxicCombination)
        {
            score += 0.75m;
        }

        return score;
    }

    private static (decimal? Score, string Source) ScoreBusinessConsequence(
        SecurityEvidencePathRecord path,
        IReadOnlySet<Guid>? activeCrownJewelAssertionIds)
    {

        if (path.CrownJewelAssertionId is not null && path.CrownJewelAssertionId != Guid.Empty)
        {
            if (activeCrownJewelAssertionIds is null
                || activeCrownJewelAssertionIds.Contains(path.CrownJewelAssertionId.Value))
            {
                return (3.5m, "asserted-crown-jewel");
            }

            return (null, "expired-or-revoked-assertion-neutral-sort");
        }

        return (null, "unknown-consequence-neutral-sort");
    }

    private static decimal ScoreConfidenceBand(PathConfidenceBand band) =>
        band switch
        {
            PathConfidenceBand.Confirmed => 4m,
            PathConfidenceBand.HighlyLikely => 3m,
            PathConfidenceBand.Probable => 2m,
            PathConfidenceBand.Possible => 1m,
            PathConfidenceBand.InsufficientEvidence => 0m,
            _ => 0m,
        };

    private static void AddContribution(
        List<SecurityEvidencePathRankDimensionContribution> contributions,
        SecurityEvidencePathRankDimension dimension,
        IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> weights,
        decimal rawScore,
        string source)
    {
        decimal weight = weights.TryGetValue(dimension, out decimal configured) ? configured : 0m;
        decimal capped = Cap(rawScore);

        contributions.Add(new SecurityEvidencePathRankDimensionContribution
        {
            Dimension = dimension,
            RawScore = capped,
            Weight = weight,
            WeightedContribution = capped * weight,
            Source = source,
        });
    }

    private static decimal Cap(decimal value) =>
        Math.Min(SecurityEvidencePathRankConstants.DimensionCap, Math.Max(0m, value));

    private static string DescribeTechnicalExposure(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        List<string> signals = [];

        if (hops.Any(hop =>
                hop.FromNodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal)
                || hop.EdgeType.Equals(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType, StringComparison.OrdinalIgnoreCase)))
        {
            signals.Add("public-exposure");
        }

        if (hops.Any(hop =>
                hop.EdgeType.Equals(SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType, StringComparison.OrdinalIgnoreCase)))
        {
            signals.Add("unrestricted-egress");
        }

        if (signals.Count == 0)
        {
            signals.Add(path.PathKind.ToString());
        }

        return string.Join('+', signals);
    }

    private static string DescribePrivilegeDepth(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        List<string> edges = hops
            .Select(hop => hop.EdgeType)
            .Where(edge =>
                edge.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase)
                || edge.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase)
                || edge.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return edges.Count == 0 ? "no-privilege-edges" : string.Join('+', edges);
    }

    private static string DescribeBlastRadius(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        if (path.PathKind == PathKind.SharedControlBlastRadius)
        {
            return "shared-control-fan-out";
        }

        int resourceCount = hops.Count(hop => hop.CloudResourceId is not null);

        return FormattableString.Invariant($"resources:{resourceCount}");
    }
}
