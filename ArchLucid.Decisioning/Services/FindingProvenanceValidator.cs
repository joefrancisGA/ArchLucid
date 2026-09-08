using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Services;

/// <summary>Typed-engine Kind A provenance at emission (LP-02). Agent Kind B is LP-03.</summary>
public sealed class FindingProvenanceValidator : IFindingProvenanceValidator
{
    public string? GetEmissionViolation(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification == FindingClassification.ChecklistCoverage)
            return null;

        if (InsightDensityFindingSourceClassifier.IsAgentArchitectureFinding(finding.FindingType))
            return null;

        return DecisionGradeFindingProvenanceValidator.GetViolation(finding);
    }
}
