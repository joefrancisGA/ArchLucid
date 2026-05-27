using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Roi;

/// <summary>Detects pricing signals in committed run findings for executive ROI basis labels.</summary>
public static class ExecutiveRoiCostFindingPricingSignalScanner
{
    private const string ExtractorCitationToken = "AzureExtractorZIP";

    private const string HeuristicFallbackToken = "Fallback Estimate";

    public sealed record PricingSignals(bool HasUploadedExtractorEvidence, bool HasHeuristicCostEvidence);

    public static PricingSignals Scan(IEnumerable<ArchitectureRunDetail> runDetails)
    {
        ArgumentNullException.ThrowIfNull(runDetails);

        bool hasUploaded = false;
        bool hasHeuristic = false;

        foreach (ArchitectureRunDetail detail in runDetails)
        {
            foreach (ArchitectureFinding finding in EnumerateActiveCostFindings(detail))
            {
                if (ContainsUploadedExtractorEvidence(finding))
                    hasUploaded = true;

                if (ContainsHeuristicCostEvidence(finding))
                    hasHeuristic = true;
            }
        }

        return new PricingSignals(hasUploaded, hasHeuristic);
    }

    private static IEnumerable<ArchitectureFinding> EnumerateActiveCostFindings(ArchitectureRunDetail detail)
    {
        foreach (ArchitectureFinding finding in detail.Results.SelectMany(static result => result.Findings))
        {
            if (finding.IsMuted)
                continue;

            if (!string.Equals(finding.Category, "Cost", StringComparison.OrdinalIgnoreCase))
                continue;

            yield return finding;
        }
    }

    private static bool ContainsUploadedExtractorEvidence(ArchitectureFinding finding)
    {
        foreach (string evidenceRef in finding.EvidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
                continue;

            if (evidenceRef.Contains(ExtractorCitationToken, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return ContainsToken(finding.Message, ExtractorCitationToken)
            || ContainsToken(finding.ReasoningTrace, ExtractorCitationToken);
    }

    private static bool ContainsHeuristicCostEvidence(ArchitectureFinding finding)
    {
        foreach (string evidenceRef in finding.EvidenceRefs)
        {
            if (ContainsToken(evidenceRef, HeuristicFallbackToken))
                return true;
        }

        return ContainsToken(finding.Message, HeuristicFallbackToken)
            || ContainsToken(finding.ReasoningTrace, HeuristicFallbackToken);
    }

    private static bool ContainsToken(string? text, string token)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        return text.Contains(token, StringComparison.OrdinalIgnoreCase);
    }
}
