using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Builds grounded prose assumption register rows from contradiction analysis (DX-61).</summary>
internal static class ProseAssumptionRegisterBuilder
{
    internal static IReadOnlyList<ProseAssumptionRegisterEntry> Build(
        IReadOnlyList<ProseAssumptionCandidate> candidates,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<ProseAssumptionInventorySlice> inventorySlices,
        IReadOnlyList<ProseAssumptionContradictionMatch> matches,
        IReadOnlyList<Finding> findings,
        int maxEntries)
    {
        ArgumentNullException.ThrowIfNull(candidates);
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(inventorySlices);
        ArgumentNullException.ThrowIfNull(matches);
        ArgumentNullException.ThrowIfNull(findings);

        if (maxEntries <= 0 || candidates.Count == 0)
            return [];

        List<ProseAssumptionRegisterEntry> entries = [];

        foreach (ProseAssumptionCandidate candidate in candidates)
        {
            if (entries.Count >= maxEntries)
                break;

            ProseAssumptionDisposition disposition = ResolveDisposition(
                candidate,
                graphSnapshot,
                inventorySlices,
                matches);

            string? findingId = null;

            if (disposition == ProseAssumptionDisposition.Contradicted)
            {
                Finding? finding = ResolveContradictionFinding(candidate, findings);

                if (finding is null || string.IsNullOrWhiteSpace(finding.FindingId))
                    continue;

                findingId = finding.FindingId;
            }

            entries.Add(new ProseAssumptionRegisterEntry
            {
                Statement = candidate.Statement,
                DocumentPath = candidate.DocumentPath,
                LineNumber = candidate.LineNumber,
                EvidenceRef = candidate.EvidenceRef,
                LogicalPropertyName = candidate.LogicalPropertyName,
                Disposition = disposition,
                FindingId = findingId,
            });
        }

        return entries;
    }

    private static ProseAssumptionDisposition ResolveDisposition(
        ProseAssumptionCandidate candidate,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<ProseAssumptionInventorySlice> inventorySlices,
        IReadOnlyList<ProseAssumptionContradictionMatch> matches)
    {
        if (matches.Any(match => SameCandidate(match.Candidate, candidate)))
            return ProseAssumptionDisposition.Contradicted;

        if (string.IsNullOrWhiteSpace(candidate.LogicalPropertyName)
            || string.IsNullOrWhiteSpace(candidate.ImpliedPropertyValue))
            return ProseAssumptionDisposition.NotVerifiable;

        foreach (ProseAssumptionInventorySlice slice in inventorySlices)
        {
            if (ProseAssumptionContradictionPass.HasConsistentInventoryMatch(
                    slice.CloudProvider,
                    slice.ResourcesJson,
                    graphSnapshot,
                    candidate))
            {
                return ProseAssumptionDisposition.Consistent;
            }
        }

        return ProseAssumptionDisposition.NotVerifiable;
    }

    private static Finding? ResolveContradictionFinding(
        ProseAssumptionCandidate candidate,
        IReadOnlyList<Finding> findings)
    {
        return findings.FirstOrDefault(finding =>
            finding.EvidenceRefs.Contains(candidate.EvidenceRef, StringComparer.OrdinalIgnoreCase));
    }

    private static bool SameCandidate(ProseAssumptionCandidate left, ProseAssumptionCandidate right)
    {
        return left.DocumentPath.Equals(right.DocumentPath, StringComparison.OrdinalIgnoreCase)
            && left.LineNumber == right.LineNumber
            && left.Statement.Equals(right.Statement, StringComparison.Ordinal);
    }
}
