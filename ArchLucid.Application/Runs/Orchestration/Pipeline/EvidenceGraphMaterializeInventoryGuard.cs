using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>Wave-23 suggestion 222: evidence-graph materialize fail-closed when pinned packages are not inventory-bound.</summary>
internal static class EvidenceGraphMaterializeInventoryGuard
{
    public static void EnsurePinnedEvidenceInventoryBoundOrThrow(
        FindingAnalysisContext? analysisContext,
        string runIdLabel)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        if (analysisContext is null)
            return;

        bool hasEvidencePin = analysisContext.EvidencePin is not null
                              || analysisContext.EvidencePins.Count > 0;

        if (!hasEvidencePin)
            return;

        if (!analysisContext.HasCreateTimeEvidencePinCommitment)
        {
            throw new ConflictException(
                $"Evidence graph materialize blocked for run '{runIdLabel}': pinned evidence package is not inventory-bound (missing create-time pin commitment).");
        }

        if (analysisContext.EvidencePin is { } evidencePin
            && (evidencePin.PackageId is null || evidencePin.PackageId == Guid.Empty))
        {
            throw new ConflictException(
                $"Evidence graph materialize blocked for run '{runIdLabel}': pinned evidence package id is missing.");
        }

        foreach (EvidencePackagePin pin in analysisContext.EvidencePins)
        {
            if (pin.PackageId is null || pin.PackageId == Guid.Empty)
            {
                throw new ConflictException(
                    $"Evidence graph materialize blocked for run '{runIdLabel}': multi-cloud evidence pin is not inventory-bound.");
            }
        }
    }
}
