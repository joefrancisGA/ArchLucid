using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps persisted <see cref="Finding" /> snapshot rows into sponsor narrative
///     <see cref="ArchitectureFinding" /> instances.
/// </summary>
public static class PilotSponsorMaterialFindingsMapper
{
    public static ArchitectureFinding MapFromSnapshotFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string message = !string.IsNullOrWhiteSpace(finding.Title)
            ? finding.Title.Trim()
            : !string.IsNullOrWhiteSpace(finding.Rationale)
                ? finding.Rationale.Trim()
                : finding.FindingId;

        List<string> evidenceRefs = [];

        if (!string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId))
            evidenceRefs.Add($"trace:{finding.AgentExecutionTraceId.Trim()}");

        return new ArchitectureFinding
        {
            FindingId = finding.FindingId,
            Severity = finding.Severity,
            Category = finding.Category ?? string.Empty,
            Message = message,
            IsMuted = finding.IsMuted,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
            EvidenceRefs = evidenceRefs,
        };
    }

    public static IReadOnlyList<ArchitectureFinding> MapFromSnapshotFindings(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        return findings
            .Where(static finding => !finding.IsMuted)
            .Select(MapFromSnapshotFinding)
            .ToList();
    }
}
