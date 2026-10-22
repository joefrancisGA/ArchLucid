using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.DecisionTraces;

/// <summary>Aggregates distinct prompt template references from accepted findings for rule-audit traces (TB-052).</summary>
public static class RuleAuditTracePromptRefAggregator
{
    public static List<RuleAuditTracePromptRef> FromAcceptedFindings(
        FindingsSnapshot findingsSnapshot,
        IReadOnlyCollection<string> acceptedFindingIds)
    {
        ArgumentNullException.ThrowIfNull(findingsSnapshot);
        ArgumentNullException.ThrowIfNull(acceptedFindingIds);

        if (acceptedFindingIds.Count == 0 || findingsSnapshot.Findings.Count == 0)
            return [];

        HashSet<string> accepted = acceptedFindingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Dictionary<string, RuleAuditTracePromptRef> distinct = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in findingsSnapshot.Findings)
        {
            if (!accepted.Contains(finding.FindingId))
                continue;

            if (string.IsNullOrWhiteSpace(finding.PromptTemplateId))
                continue;

            string templateId = finding.PromptTemplateId.Trim();
            string key = $"{templateId}|{finding.PromptTemplateVersion?.Trim() ?? string.Empty}";

            if (distinct.ContainsKey(key))
                continue;

            distinct[key] = new RuleAuditTracePromptRef
            {
                TemplateId = templateId,
                TemplateVersion = string.IsNullOrWhiteSpace(finding.PromptTemplateVersion)
                    ? "—"
                    : finding.PromptTemplateVersion.Trim(),
                AgentType = string.IsNullOrWhiteSpace(finding.EngineType) ? null : finding.EngineType.Trim(),
            };
        }

        return distinct.Values
            .OrderBy(static reference => reference.TemplateId, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
