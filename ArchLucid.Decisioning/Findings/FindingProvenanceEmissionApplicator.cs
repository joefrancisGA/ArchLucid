using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Holds typed findings that lack Kind A provenance in the checklist band (LP-02).</summary>
public static class FindingProvenanceEmissionApplicator
{
    public static void Apply(IReadOnlyList<Finding> findings, IFindingProvenanceValidator validator)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(validator);

        foreach (Finding finding in findings)
        {
            string? violation = validator.GetEmissionViolation(finding);

            if (violation is null)
                continue;

            finding.Classification = FindingClassification.ChecklistCoverage;
            finding.Treatment = FindingTreatment.DemoteToChecklist;
            finding.Trace ??= new ExplainabilityTrace();
            finding.Trace.Notes ??= [];
            finding.Trace.Notes.Add($"provenance-hold: {violation}");
        }
    }
}
