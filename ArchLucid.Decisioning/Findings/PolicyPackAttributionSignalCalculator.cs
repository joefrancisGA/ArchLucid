namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Measures how many findings cite assigned pack rule ids via <see cref="Finding.PolicyRuleId" /> or
///     <see cref="ExplainabilityTrace.RulesApplied" />.
/// </summary>
public static class PolicyPackAttributionSignalCalculator
{
    public static bool IsAttributable(Finding finding, IReadOnlySet<string> packRuleIds)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(packRuleIds);

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            string trimmedPolicyRuleId = finding.PolicyRuleId.Trim();

            if (packRuleIds.Contains(trimmedPolicyRuleId))
                return true;
        }

        ExplainabilityTrace trace = finding.Trace;

        if (trace is null)
            return false;

        foreach (string ruleToken in trace.RulesApplied)
        {
            if (string.IsNullOrWhiteSpace(ruleToken))
                continue;

            if (packRuleIds.Contains(ruleToken.Trim()))
                return true;
        }

        return false;
    }

    public static PolicyPackAttributionSignal Calculate(FindingsSnapshot snapshot, PolicyPackContentDocument pack)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(pack);

        HashSet<string> packRuleIds = PolicyPackAssignedRuleIdCollector.Collect(pack);
        List<Finding> findings = snapshot.Findings;

        if (findings.Count == 0)
            return new PolicyPackAttributionSignal
            {
                TotalFindingCount = 0,
                AttributableFindingCount = 0,
                AttributionPercentage = 0.0,
                ByEngine = [],
            };

        int attributableFindingCount = 0;

        List<(string EngineType, bool IsAttributable)> perFinding = [];

        foreach (Finding finding in findings)
        {
            bool isAttributable = IsAttributable(finding, packRuleIds);

            if (isAttributable)
                attributableFindingCount++;

            perFinding.Add((finding.EngineType, isAttributable));
        }

        double attributionPercentage = (attributableFindingCount / (double)findings.Count) * 100.0;

        List<PolicyPackAttributionEngineRow> byEngine = perFinding
            .GroupBy(x => x.EngineType, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                List<(string EngineType, bool IsAttributable)> engineFindings = g.ToList();
                int findingCount = engineFindings.Count;
                int engineAttributableCount = engineFindings.Count(x => x.IsAttributable);
                double enginePercentage = findingCount == 0
                    ? 0.0
                    : (engineAttributableCount / (double)findingCount) * 100.0;

                return new PolicyPackAttributionEngineRow
                {
                    EngineType = g.Key,
                    FindingCount = findingCount,
                    AttributableFindingCount = engineAttributableCount,
                    AttributionPercentage = enginePercentage,
                };
            })
            .ToList();

        return new PolicyPackAttributionSignal
        {
            TotalFindingCount = findings.Count,
            AttributableFindingCount = attributableFindingCount,
            AttributionPercentage = attributionPercentage,
            ByEngine = byEngine,
        };
    }
}