using System.Text.RegularExpressions;

using ArchLucid.Contracts.Risk;
using ArchLucid.Decisioning.Analysis;

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
                if (!DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, pattern))
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
        if (DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "rto"))
            return true;

        if (DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "recovery time"))
            return true;

        if (DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "uptime")
            || DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "availability"))
            return ContainsHighAvailabilityTarget(normalizedRequirement);

        return DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "failover")
            || DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "disaster recovery")
            || DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "geo-redundant")
            || DecisioningTextTokenMatcher.ContainsPattern(normalizedRequirement, "multi-region");
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
