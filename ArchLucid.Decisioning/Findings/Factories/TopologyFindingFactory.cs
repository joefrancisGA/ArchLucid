using ArchLucid.Decisioning.Models;

using ExplainabilityMarkers = ArchLucid.Decisioning.Findings.ExplainabilityTraceMarkers;

namespace ArchLucid.Decisioning.Findings.Factories;

public static class TopologyFindingFactory
{
    public static Finding CreateTopologyGapFinding(
        string engineType,
        string title,
        string rationale,
        string gapCode,
        string description,
        string impact,
        FindingSeverity severity = FindingSeverity.Warning,
        IEnumerable<string>? relatedNodeIds = null)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.TopologyGap,
            Category = "Topology",
            EngineType = engineType,
            Severity = severity,
            Title = title,
            Rationale = rationale,
            RelatedNodeIds = relatedNodeIds?.ToList() ?? [],
            PayloadType = nameof(TopologyGapFindingPayload),
            Payload =
                new TopologyGapFindingPayload { GapCode = gapCode, Description = description, Impact = impact },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds?.ToList() ?? [],
                RulesApplied = [$"topology-gap-{gapCode}"],
                DecisionsTaken = [$"Detected topology gap: {description}"],
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote]
            }
        };
    }

    public static Finding CreateSecurityGapFinding(
        string engineType,
        string title,
        string rationale,
        string gapCode,
        string description,
        string impact,
        FindingSeverity severity = FindingSeverity.Warning,
        IEnumerable<string>? relatedNodeIds = null)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = FindingTypes.SecurityGap,
            Category = "Security",
            EngineType = engineType,
            Severity = severity,
            Title = title,
            Rationale = rationale,
            RelatedNodeIds = relatedNodeIds?.ToList() ?? [],
            PayloadType = nameof(TopologyGapFindingPayload),
            Payload =
                new TopologyGapFindingPayload { GapCode = gapCode, Description = description, Impact = impact },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds?.ToList() ?? [],
                RulesApplied = [$"security-gap-{gapCode}"],
                DecisionsTaken = [$"Detected security traceability gap: {description}"],
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote]
            }
        };
    }
}
