using ArchLucid.Decisioning.Models;

using ExplainabilityMarkers = ArchLucid.Decisioning.Findings.ExplainabilityTraceMarkers;

namespace ArchLucid.Decisioning.Findings.Factories;

public static class RequirementFindingFactory
{
    public static Finding CreateRequirementFinding(
        string engineType,
        string title,
        string rationale,
        string requirementName,
        string requirementText,
        bool isMandatory,
        IEnumerable<string>? relatedNodeIds = null)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "RequirementFinding",
            Category = "Requirement",
            EngineType = engineType,
            Severity = FindingSeverity.Info,
            Title = title,
            Rationale = rationale,
            RelatedNodeIds = relatedNodeIds?.ToList() ?? [],
            PayloadType = nameof(RequirementFindingPayload),
            Payload = new RequirementFindingPayload { RequirementName = requirementName, RequirementText = requirementText, IsMandatory = isMandatory }
        };
    }

    public static Finding CreateRequirementGapFinding(
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
            FindingType = FindingTypes.RequirementGap,
            Category = "Requirement",
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
                RulesApplied = [$"requirement-gap-{gapCode}"],
                DecisionsTaken = [$"Detected requirement traceability gap: {description}"],
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote]
            }
        };
    }
}
