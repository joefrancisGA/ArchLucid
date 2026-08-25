using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>Maps persisted findings-snapshot rows into sponsor narrative <see cref="ArchitectureFinding"/> projections.</summary>
internal static class PilotSponsorMaterialFindingsMapper
{
    internal static IReadOnlyList<ArchitectureFinding> MapSnapshotFindings(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        return findings
            .Where(static finding => !finding.IsMuted)
            .Select(ToArchitectureFinding)
            .ToList();
    }

    private static ArchitectureFinding ToArchitectureFinding(Finding finding)
    {
        string message = !string.IsNullOrWhiteSpace(finding.Title)
            ? finding.Title.Trim()
            : finding.Rationale?.Trim() ?? string.Empty;

        return new ArchitectureFinding
        {
            FindingId = finding.FindingId,
            Severity = finding.Severity,
            Category = finding.Category ?? string.Empty,
            Message = message,
            IsMuted = finding.IsMuted,
            PolicyRuleId = finding.PolicyRuleId,
            EnforcementTier = finding.EnforcementTier,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
        };
    }
}
