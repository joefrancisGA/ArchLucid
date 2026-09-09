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
                continue;

            finding.Classification = FindingClassification.ChecklistCoverage;
            finding.Treatment = FindingTreatment.DemoteToChecklist;
            finding.Trace ??= new ExplainabilityTrace();
            finding.Trace.Notes ??= [];
            finding.Trace.Notes.Add($"provenance-hold: {violation}");
        }
    }
}
