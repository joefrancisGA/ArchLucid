using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>Maps persisted snapshot <see cref="Finding" /> rows to sponsor-facing <see cref="ArchitectureFinding" /> projections.</summary>
internal static class PilotSnapshotFindingMapper
{
    public static ArchitectureFinding ToArchitectureFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string message = !string.IsNullOrWhiteSpace(finding.Title)
            ? finding.Title.Trim()
            : !string.IsNullOrWhiteSpace(finding.Rationale)
                ? finding.Rationale.Trim()
                : finding.Category?.Trim() ?? string.Empty;

        List<string> evidenceRefs = [];

        if (!string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId))
            evidenceRefs.Add($"trace:{finding.AgentExecutionTraceId.Trim()}");

        foreach (string nodeId in finding.RelatedNodeIds.Where(static id => !string.IsNullOrWhiteSpace(id)))
            evidenceRefs.Add($"node:{nodeId.Trim()}");

        return new ArchitectureFinding
        {
            FindingId = finding.FindingId,
            Severity = finding.Severity,
            Category = finding.Category ?? string.Empty,
            Message = message,
            PolicyRuleId = finding.PolicyRuleId,
            EnforcementTier = finding.EnforcementTier,
            IsMuted = finding.IsMuted,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
            EvidenceRefs = evidenceRefs,
        };
    }
}
