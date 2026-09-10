using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.WafTradeoff;

namespace ArchLucid.Decisioning.Risk;

public sealed class TradeoffDetectionEngine : ITradeoffDetectionEngine
{
    private readonly IWafTradeoffCatalog _catalog;
    private readonly IFindingPayloadJsonCompletionClient _completionClient;

    public TradeoffDetectionEngine(
        IWafTradeoffCatalog catalog,
        IFindingPayloadJsonCompletionClient completionClient)
    {
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        _completionClient = completionClient ?? throw new ArgumentNullException(nameof(completionClient));
    }

    public async Task<IReadOnlyList<ArchitectureTradeoff>> DetectAsync(
        ManifestDocument manifest,
        TransparencyTrail trail,
        IReadOnlyList<string> statedRequirements,
        string? businessOutcome,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(trail);
        ArgumentNullException.ThrowIfNull(statedRequirements);

        ManifestTradeoffScanContext scanContext = ManifestTradeoffScanContextBuilder.Build(manifest);
        List<ArchitectureTradeoff> tradeoffs = [];

        foreach (WafTradeoffCatalogEntry catalogEntry in _catalog.All)
        {
            if (!IsCatalogEntryDetected(scanContext, catalogEntry))
                continue;

            ArchitectureTradeoff tradeoff = BuildTradeoff(
                scanContext,
                catalogEntry,
                trail,
                statedRequirements);

            tradeoffs.Add(tradeoff);
        }

        WafPillar? outcomePillar = TradeoffOptimizationMismatchDetector.ResolveOutcomePillar(businessOutcome);
        WafPillar? dominantSacrificedPillar =
            TradeoffOptimizationMismatchDetector.ResolveDominantSacrificedPillar(tradeoffs);

        TradeoffOptimizationMismatchDetector.ApplyRelatedOutcomeRefs(
            tradeoffs,
            businessOutcome,
            outcomePillar,
            dominantSacrificedPillar);

        List<ArchitectureTradeoff> orderedTradeoffs = TradeoffOrdering.Sort(tradeoffs);

        await TradeoffConflictExplanationComposer
            .ApplyExplanationsAsync(
                _completionClient,
                _catalog,
                orderedTradeoffs,
                statedRequirements,
                cancellationToken)
            .ConfigureAwait(false);

        return orderedTradeoffs;
    }

    private static bool IsCatalogEntryDetected(
        ManifestTradeoffScanContext scanContext,
        WafTradeoffCatalogEntry catalogEntry)
    {
        foreach (string signature in catalogEntry.DetectionSignatures)
        {
            if (scanContext.ContainsSignature(signature))
                return true;
        }

        return false;
    }

    private static ArchitectureTradeoff BuildTradeoff(
        ManifestTradeoffScanContext scanContext,
        WafTradeoffCatalogEntry catalogEntry,
        TransparencyTrail trail,
        IReadOnlyList<string> statedRequirements)
    {
        List<string> evidenceNodeIds = ResolveEvidenceNodeIds(scanContext, catalogEntry);
        string? acknowledgmentKey = TradeoffAcknowledgmentResolver.ResolveAcknowledgmentAnswerKey(trail, catalogEntry);
        (bool isConflicting, string? conflictingRequirementId) =
            TradeoffRequirementConflictDetector.DetectConflict(catalogEntry.SacrificedPillar, statedRequirements);

        TradeoffStatus status;

        if (isConflicting)
            status = TradeoffStatus.Conflicting;
        else if (acknowledgmentKey is not null)
            status = TradeoffStatus.Acknowledged;
        else
            status = TradeoffStatus.Unacknowledged;

        RiskConsequence consequence = catalogEntry.DefaultConsequence;

        if (status == TradeoffStatus.Conflicting)
            consequence = RiskConsequence.High;

        ArchitectureTradeoff tradeoff = new()
        {
            GainedPillar = catalogEntry.GainedPillar,
            SacrificedPillar = catalogEntry.SacrificedPillar,
            Mechanism = catalogEntry.MechanismKey,
            EvidenceNodeIds = evidenceNodeIds,
            AcknowledgedByAnswerKey = acknowledgmentKey,
            ConflictingRequirementId = isConflicting ? conflictingRequirementId : null,
            Status = status,
            Consequence = consequence,
            Reversibility = TradeoffReversibilityCalculator.Compute(scanContext, catalogEntry, evidenceNodeIds),
            CounterfactualRef = catalogEntry.CounterfactualKey,
        };

        return tradeoff;
    }

    private static List<string> ResolveEvidenceNodeIds(
        ManifestTradeoffScanContext scanContext,
        WafTradeoffCatalogEntry catalogEntry)
    {
        List<string> evidenceNodeIds = [];

        foreach (string signature in catalogEntry.DetectionSignatures)
        {
            if (!scanContext.ContainsSignature(signature))
                continue;

            evidenceNodeIds.Add($"manifest:{catalogEntry.MechanismKey}:{signature}");
        }

        return evidenceNodeIds;
    }
}
