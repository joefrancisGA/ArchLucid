using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Roi;

/// <summary>Classifies orphan-candidate findings using structured markers with legacy message fallback.</summary>
internal static class OrphanCandidateFindingClassifier
{
    internal static bool IsOrphanCandidate(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.Equals(finding.Category, "CostOptimization", StringComparison.OrdinalIgnoreCase))
            return false;

        if (HasStructuredMarker(finding))
            return true;

        return MatchesLegacyMessageHeuristic(finding.Message);
    }

    internal static IEnumerable<ArchitectureFinding> DistinctByFindingId(IEnumerable<ArchitectureFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (ArchitectureFinding finding in findings)
        {
            string key = string.IsNullOrWhiteSpace(finding.FindingId)
                ? $"{finding.Category}|{finding.Message}|{finding.EstimatedUsdSavings}"
                : finding.FindingId;

            if (!seen.Add(key))
                continue;

            yield return finding;
        }
    }

    private static bool HasStructuredMarker(ArchitectureFinding finding)
    {
        foreach (string evidenceRef in finding.EvidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
                continue;

            if (evidenceRef.Equals(OrphanCandidateFindingMarkers.FindingTypeOrphanedAzureResource, StringComparison.OrdinalIgnoreCase)
                || evidenceRef.Equals(OrphanCandidateFindingMarkers.EngineOrphanedAzureResource, StringComparison.OrdinalIgnoreCase)
                || evidenceRef.Equals(OrphanCandidateFindingMarkers.OrphanCandidateAzureResource, StringComparison.OrdinalIgnoreCase))
                return true;

            if (evidenceRef.StartsWith("finding-type:OrphanedAzureResource", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool MatchesLegacyMessageHeuristic(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        return message.Contains("orphan", StringComparison.OrdinalIgnoreCase)
               || message.Contains("Unattached managed disk", StringComparison.OrdinalIgnoreCase)
               || message.Contains("no virtualMachine attachment", StringComparison.OrdinalIgnoreCase)
               || message.Contains("no ipConfiguration", StringComparison.OrdinalIgnoreCase);
    }
}
