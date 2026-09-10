using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Holds typed findings that lack Kind A provenance in the checklist band (LP-02).</summary>
public static class FindingProvenanceEmissionApplicator
{
    public static void EnrichDiagramEvidenceRefs(IReadOnlyList<Finding> findings, GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        foreach (Finding finding in findings)
        {
            if (finding.RelatedNodeIds is not { Count: > 0 } relatedNodeIds)
            {
                continue;
            }

            List<string> diagramEvidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(
                graphSnapshot,
                relatedNodeIds);

            if (diagramEvidenceRefs.Count == 0)
            {
                continue;
            }

            finding.EvidenceRefs ??= [];

            foreach (string evidenceRef in diagramEvidenceRefs)
            {
                if (!evidenceRef.StartsWith(DiagramEvidenceCitationRefs.Prefix, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                FindingEvidenceRefs.TryAppendDistinct(finding.EvidenceRefs, evidenceRef);
            }
        }
    }

    public static void Apply(IReadOnlyList<Finding> findings, IFindingProvenanceValidator validator)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(validator);

        foreach (Finding finding in findings)
        {
            string? violation = validator.GetEmissionViolation(finding);

            if (violation is null)
            {
                // Density gate runs first and classifies uncited rows as checklist, which
                // makes GetEmissionViolation skip. Still record Kind A holds so operators
                // see provenance-hold: rather than only a density demote.
                TryAppendHoldNoteAfterDensityDemotion(finding);
                continue;
            }

            HoldAsChecklist(finding, violation);
        }
    }

    private static void TryAppendHoldNoteAfterDensityDemotion(Finding finding)
    {
        if (!IsDensityDemotedToChecklist(finding))
            return;

        if (InsightDensityFindingSourceClassifier.IsAgentArchitectureFinding(finding.FindingType))
            return;

        string? violation = DecisionGradeFindingProvenanceValidator.GetViolation(finding);

        if (violation is null)
            return;

        AppendProvenanceHoldNote(finding, violation);
    }

    private static bool IsDensityDemotedToChecklist(Finding finding)
    {
        return finding.Classification == FindingClassification.ChecklistCoverage
            || finding.Treatment == FindingTreatment.DemoteToChecklist;
    }

    private static void HoldAsChecklist(Finding finding, string violation)
    {
        finding.Classification = FindingClassification.ChecklistCoverage;
        finding.Treatment = FindingTreatment.DemoteToChecklist;
        AppendProvenanceHoldNote(finding, violation);
    }

    private static void AppendProvenanceHoldNote(Finding finding, string violation)
    {
        finding.Trace ??= new ExplainabilityTrace();
        finding.Trace.Notes ??= [];

        if (finding.Trace.Notes.Any(static note =>
                note.StartsWith("provenance-hold:", StringComparison.Ordinal)))
        {
            return;
        }

        finding.Trace.Notes.Add($"provenance-hold: {violation}");
    }
}
