using System.Text;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime;

/// <summary>Bounded evidence excerpt for insight-density judge prompts on deterministic engine findings.</summary>
public static class InsightDensityEngineFindingEvidenceSummary
{
    public static string Build(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        StringBuilder builder = new();
        builder.AppendLine($"EngineType: {finding.EngineType}");
        builder.AppendLine($"FindingType: {finding.FindingType}");
        builder.AppendLine($"Category: {finding.Category}");
        builder.AppendLine($"Severity: {finding.Severity}");

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            builder.AppendLine($"PolicyRuleId: {finding.PolicyRuleId.Trim()}");
        }

        ExplainabilityTrace? trace = finding.Trace;

        if (trace is not null)
        {
            if (trace.GraphNodeIdsExamined.Count > 0)
            {
                builder.AppendLine("GraphNodeIdsExamined:");
                foreach (string nodeId in trace.GraphNodeIdsExamined)
                {
                    builder.AppendLine($"  - {nodeId}");
                }
            }

            if (trace.RulesApplied.Count > 0)
            {
                builder.AppendLine("RulesApplied:");
                foreach (string rule in trace.RulesApplied)
                {
                    builder.AppendLine($"  - {rule}");
                }
            }
        }

        if (finding.RelatedNodeIds.Count > 0)
        {
            builder.AppendLine("RelatedNodeIds:");
            foreach (string nodeId in finding.RelatedNodeIds)
            {
                builder.AppendLine($"  - {nodeId}");
            }
        }

        if (finding.Payload is not null)
        {
            builder.AppendLine($"PayloadType: {finding.Payload.GetType().Name}");
        }

        if (builder.Length == 0)
        {
            return "(engine finding carries title/rationale only)";
        }

        return builder.ToString();
    }

    public static HashSet<string> CollectAllowedEvidenceRefs(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        HashSet<string> allowedRefs = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            allowedRefs.Add(finding.PolicyRuleId.Trim());
        }

        ExplainabilityTrace? trace = finding.Trace;

        if (trace is not null)
        {
            foreach (string nodeId in trace.GraphNodeIdsExamined)
            {
                if (!string.IsNullOrWhiteSpace(nodeId))
                {
                    allowedRefs.Add(nodeId.Trim());
                }
            }

            foreach (string rule in trace.RulesApplied)
            {
                if (!string.IsNullOrWhiteSpace(rule))
                {
                    allowedRefs.Add(rule.Trim());
                }
            }
        }

        foreach (string nodeId in finding.RelatedNodeIds)
        {
            if (!string.IsNullOrWhiteSpace(nodeId))
            {
                allowedRefs.Add(nodeId.Trim());
            }
        }

        return allowedRefs;
    }
}
