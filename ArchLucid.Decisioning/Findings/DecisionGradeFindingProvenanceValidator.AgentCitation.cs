using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

public static partial class DecisionGradeFindingProvenanceValidator
{
    private static bool HasAgentCitationProvenance(Finding finding)
    {
        if (finding.Trace?.Citations is { Count: > 0 } citations
            && citations.Any(static c => !string.IsNullOrWhiteSpace(c)))
            return true;

        return false;
    }
}
