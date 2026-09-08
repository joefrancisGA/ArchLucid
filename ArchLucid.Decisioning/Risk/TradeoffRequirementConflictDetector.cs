using System.Text.RegularExpressions;

using ArchLucid.Contracts.Risk;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffRequirementConflictDetector
{
    private static readonly IReadOnlyDictionary<WafPillar, string[]> PillarConflictPatterns =
        new Dictionary<WafPillar, string[]>
        {
            [WafPillar.Reliability] =
            [
                "rto",
                "recovery time",
                "uptime",
                "availability",
                "failover",
                "disaster recovery",
                "geo-redundant",
                "multi-region",
                "high availability",
                "sla",
            ],
            [WafPillar.Performance] =
            [
                "latency",
                "response time",
                "throughput",
                "p95",
                "p99",
                "sub-second",
            ],
            [WafPillar.Security] =
            [
                "encryption",
                "mfa",
                "zero trust",
                "private endpoint",
                "compliance",
                "pci",
                "hipaa",
            ],
            [WafPillar.Cost] =
            [
                "budget",
                "cost ceiling",
                "under $",
                "monthly spend",
            ],
            [WafPillar.Operations] =
            [
                "runbook",
                "on-call",
                "operational burden",
                "toil",
            ],
        };

    public static (bool IsConflicting, string? RequirementId) DetectConflict(
        WafPillar sacrificedPillar,
        IReadOnlyList<string> statedRequirements)
    {
        if (!PillarConflictPatterns.TryGetValue(sacrificedPillar, out string[]? patterns))
            return (false, null);

        for (int index = 0; index < statedRequirements.Count; index++)
        {
            string requirement = statedRequirements[index];

            if (string.IsNullOrWhiteSpace(requirement))
                continue;

            string normalizedRequirement = requirement.ToLowerInvariant();

            foreach (string pattern in patterns)
            {
                if (!normalizedRequirement.Contains(pattern, StringComparison.Ordinal))
                    continue;

                if (sacrificedPillar == WafPillar.Reliability && IsStrictReliabilityRequirement(normalizedRequirement))
                    return (true, $"req-{index}");

                if (sacrificedPillar != WafPillar.Reliability)
                    return (true, $"req-{index}");
            }
        }

        return (false, null);
    }

    private static bool IsStrictReliabilityRequirement(string normalizedRequirement)
    {
        if (normalizedRequirement.Contains("rto", StringComparison.Ordinal))
            return true;

        if (normalizedRequirement.Contains("recovery time", StringComparison.Ordinal))
            return true;

        if (normalizedRequirement.Contains("uptime", StringComparison.Ordinal)
            || normalizedRequirement.Contains("availability", StringComparison.Ordinal))
            return ContainsHighAvailabilityTarget(normalizedRequirement);

        return normalizedRequirement.Contains("failover", StringComparison.Ordinal)
            || normalizedRequirement.Contains("disaster recovery", StringComparison.Ordinal)
            || normalizedRequirement.Contains("geo-redundant", StringComparison.Ordinal)
            || normalizedRequirement.Contains("multi-region", StringComparison.Ordinal);
    }

    private static bool ContainsHighAvailabilityTarget(string normalizedRequirement)
    {
        Match match = Regex.Match(normalizedRequirement, @"99\.\d+%");

        if (!match.Success)
            return true;

        if (double.TryParse(match.Value.TrimEnd('%'), out double availability))
            return availability >= 99.9;

        return true;
    }
}
