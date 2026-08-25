using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IFindingEvidenceLinkageFindingEngine" />
public sealed class FindingEvidenceLinkageFindingEngine : IFindingEvidenceLinkageFindingEngine
{
    public IReadOnlyList<Finding> Evaluate(string runId, IReadOnlyList<Finding> findings)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(findings);

        List<Finding> linkageFindings = [];

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            if (finding.Severity is not (FindingSeverity.Error or FindingSeverity.Critical))
                continue;

            if (HasEvidenceLinkage(finding))
                continue;

            linkageFindings.Add(CreateLinkageGapFinding(runId, finding));
        }

        return linkageFindings;
    }

    internal static bool HasEvidenceLinkage(Finding finding)
    {
        if (finding.RelatedNodeIds.Count > 0)
            return true;

        if (!string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId))
            return true;

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            return true;

        if (!string.IsNullOrWhiteSpace(finding.RequestInputRef))
            return true;

        if (finding.Trace.Citations.Count > 0)
            return true;

        if (finding.Trace.GraphNodeIdsExamined.Count > 0)
            return true;

        if (!string.IsNullOrWhiteSpace(finding.Trace.SourceAgentExecutionTraceId))
            return true;

        return string.Equals(finding.EngineType, "TechnologyConsistencyFindingEngine", StringComparison.Ordinal);
    }

    private static Finding CreateLinkageGapFinding(string runId, Finding sourceFinding)
    {
        return new Finding
        {
            FindingId = $"evidence-linkage-{sourceFinding.FindingId}",
            FindingType = "EvidenceLinkage",
            Category = "EvidenceIntegrity",
            EngineType = nameof(FindingEvidenceLinkageFindingEngine),
            Severity = FindingSeverity.Warning,
            Title = "High-severity finding lacks evidence linkage",
            Rationale =
                $"Finding '{sourceFinding.Title}' ({sourceFinding.FindingId}) has no graph node, citation, trace, or policy rule anchor.",
            RunIdRef = runId,
            RelatedNodeIds = sourceFinding.RelatedNodeIds.ToList(),
            EnforcementTier = FindingEnforcementTier.Advisory,
            Properties =
            {
                ["sourceFindingId"] = sourceFinding.FindingId,
            },
        };
    }
}
