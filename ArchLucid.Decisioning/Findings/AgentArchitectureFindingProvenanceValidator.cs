using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>TB-1221 / LP-03: Kind B per-finding citation provenance for agent architecture findings at emission.</summary>
public static class AgentArchitectureFindingProvenanceValidator
{
    public static bool HasKindBProvenance(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (IsExemptFromKindB(finding))
            return true;

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            return true;

        return GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(finding.EvidenceRefs);
    }

    public static string? GetEmissionViolation(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (IsExemptFromKindB(finding))
            return null;

        return HasKindBProvenance(finding)
            ? null
            : $"Finding '{finding.FindingId}' lacks agent citation provenance.";
    }

    private static bool IsExemptFromKindB(ArchitectureFinding finding)
    {
        if (finding.Classification == FindingClassification.ChecklistCoverage)
            return true;

        if (finding.Treatment == FindingTreatment.DemoteToChecklist)
            return true;

        if (finding.ConfidenceLevel == FindingConfidenceLevel.Low)
            return true;

        return false;
    }
}
