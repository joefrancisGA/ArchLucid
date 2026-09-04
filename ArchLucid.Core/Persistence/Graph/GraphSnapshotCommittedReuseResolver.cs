using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Reuses an already-persisted graph for a run when the run header or an orphan save references it (TB-042).
///     Wave-2/3: reuse requires observational equality with admitted context, κ, and architecture version pins.
///     Wave-10 suggestion 93: reuse also requires create-time pin hash fingerprints on the graph context node.
/// </summary>
public static class GraphSnapshotCommittedReuseResolver
{
    private const string ContextCanonicalFingerprintKey = "contextCanonicalFingerprint";
    private const string KnowledgeModelFingerprintKey = "knowledgeModelFingerprint";
    private const string ArchitectureVersionIdKey = "architectureVersionId";
    private const string PolicyPackPinsHashSha256HexKey = "policyPackPinsHashSha256Hex";
    private const string EvidencePackagePinsHashSha256HexKey = "evidencePackagePinsHashSha256Hex";
    private const string ArchitectureVersionContentHashSha256HexKey = "architectureVersionContentHashSha256Hex";
    private const string KnowledgeModelContentHashSha256HexKey = "knowledgeModelContentHashSha256Hex";
    private const string FocusedPilotModeEnabledKey = "focusedPilotModeEnabled";
    private const string FocusedPilotCloudProviderKey = "focusedPilotCloudProvider";

    /// <summary>
    ///     Returns a committed graph when <paramref name="runGraphSnapshotId" /> loads successfully, or when the latest graph
    ///     for <paramref name="contextSnapshotId" /> belongs to <paramref name="runId" /> (save succeeded but header update
    ///     failed).
    /// </summary>
    public static async Task<GraphSnapshotResolutionResult?> TryResolveAsync(
        ScopeContext scope,
        Guid runId,
        Guid? runGraphSnapshotId,
        Guid contextSnapshotId,
        IGraphSnapshotRepository graphSnapshotRepository,
        CancellationToken ct,
        ContextSnapshot? contextSnapshot = null,
        ArchitectureKnowledgeModel? knowledgeModel = null,
        Guid? expectedArchitectureVersionId = null,
        RunRecord? runHeader = null)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);

        if (runGraphSnapshotId is Guid headerGraphId)
        {
            GraphSnapshot? fromHeader = await graphSnapshotRepository.GetByIdAsync(scope, headerGraphId, ct);

            if (fromHeader is not null
                && IsObservationallyEqual(
                    contextSnapshotId,
                    contextSnapshot,
                    knowledgeModel,
                    fromHeader,
                    expectedArchitectureVersionId,
                    runHeader))
            {
                return new GraphSnapshotResolutionResult(fromHeader, "reused_from_run_header");
            }
        }

        // When the run header FK is cleared (e.g. sibling κ mutation), do not resurrect a stale orphan graph.

        if (runGraphSnapshotId is null)
            return null;

        GraphSnapshot? latestForContext = await graphSnapshotRepository
            .GetLatestByContextSnapshotIdAsync(scope, contextSnapshotId, ct);

        if (latestForContext is not null
            && latestForContext.RunId == runId
            && IsObservationallyEqual(
                contextSnapshotId,
                contextSnapshot,
                knowledgeModel,
                latestForContext,
                expectedArchitectureVersionId,
                runHeader))
        {
            return new GraphSnapshotResolutionResult(latestForContext, "reused_from_orphan_save");
        }

        return null;
    }

    private static bool IsObservationallyEqual(
        Guid contextSnapshotId,
        ContextSnapshot? contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        GraphSnapshot graph,
        Guid? expectedArchitectureVersionId,
        RunRecord? runHeader)
    {
        if (graph.ContextSnapshotId != contextSnapshotId)
            return false;

        if (contextSnapshot is null)
            return false;

        string expectedContextFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot);
        string? storedContextFingerprint = ReadContextProperty(graph, ContextCanonicalFingerprintKey);

        if (string.IsNullOrEmpty(storedContextFingerprint)
            || !string.Equals(
                storedContextFingerprint.Trim(),
                expectedContextFingerprint.Trim(),
                StringComparison.Ordinal))
        {
            return false;
        }

        string expectedModelFingerprint =
            GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel);
        string? storedModelFingerprint = ReadContextProperty(graph, KnowledgeModelFingerprintKey);

        if (string.IsNullOrEmpty(storedModelFingerprint)
            || !string.Equals(
                storedModelFingerprint.Trim(),
                expectedModelFingerprint.Trim(),
                StringComparison.Ordinal))
        {
            return false;
        }

        if (expectedArchitectureVersionId is Guid expectedVersionId && expectedVersionId != Guid.Empty)
        {
            string? storedVersion = ReadContextProperty(graph, ArchitectureVersionIdKey);

            if (string.IsNullOrWhiteSpace(storedVersion)
                || !Guid.TryParse(storedVersion.Trim(), out Guid parsedVersion)
                || parsedVersion != expectedVersionId)
            {
                return false;
            }
        }

        if (runHeader is null)
            return true;

        if (!PinFingerprintMatchesHeader(
                graph,
                PolicyPackPinsHashSha256HexKey,
                runHeader.PinnedPolicyPackIdsHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                EvidencePackagePinsHashSha256HexKey,
                runHeader.PinnedEvidencePackagePinsHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                ArchitectureVersionContentHashSha256HexKey,
                runHeader.PinnedArchitectureVersionContentHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                KnowledgeModelContentHashSha256HexKey,
                runHeader.PinnedKnowledgeModelContentHashSha256))
        {
            return false;
        }

        if (!FocusedPilotPinMatchesHeader(graph, runHeader))
        {
            return false;
        }

        return true;
    }

    /// <summary>
    ///     Wave-12 suggestion 117: KM-aware graph clone must match run header create-time pin fingerprints.
    /// </summary>
    public static bool GraphPinFingerprintsMatchRunHeader(GraphSnapshot graph, RunRecord runHeader)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(runHeader);

        if (!PinFingerprintMatchesHeader(
                graph,
                PolicyPackPinsHashSha256HexKey,
                runHeader.PinnedPolicyPackIdsHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                EvidencePackagePinsHashSha256HexKey,
                runHeader.PinnedEvidencePackagePinsHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                ArchitectureVersionContentHashSha256HexKey,
                runHeader.PinnedArchitectureVersionContentHashSha256))
        {
            return false;
        }

        if (!PinFingerprintMatchesHeader(
                graph,
                KnowledgeModelContentHashSha256HexKey,
                runHeader.PinnedKnowledgeModelContentHashSha256))
        {
            return false;
        }

        return FocusedPilotPinMatchesHeader(graph, runHeader);
    }

    private static bool FocusedPilotPinMatchesHeader(GraphSnapshot graph, RunRecord runHeader)
    {
        string? expectedMode = FormatFocusedPilotModeEnabled(runHeader.PinnedFocusedPilotModeEnabled);

        if (expectedMode is not null
            && !PinStringPropertyMatches(graph, FocusedPilotModeEnabledKey, expectedMode))
        {
            return false;
        }

        string? expectedProvider = FormatFocusedPilotCloudProvider(runHeader.PinnedFocusedPilotCloudProvider);

        if (expectedProvider is not null
            && !PinStringPropertyMatches(graph, FocusedPilotCloudProviderKey, expectedProvider))
        {
            return false;
        }

        return true;
    }

    private static string? FormatFocusedPilotModeEnabled(bool? enabled) =>
        enabled is null ? null : enabled.Value ? "true" : "false";

    private static string? FormatFocusedPilotCloudProvider(int? cloudProvider) =>
        cloudProvider?.ToString();

    private static bool PinStringPropertyMatches(GraphSnapshot graph, string propertyKey, string expected)
    {
        string? stored = ReadContextProperty(graph, propertyKey);

        return !string.IsNullOrEmpty(stored)
               && string.Equals(stored.Trim(), expected, StringComparison.OrdinalIgnoreCase);
    }

    private static bool PinFingerprintMatchesHeader(
        GraphSnapshot graph,
        string propertyKey,
        byte[]? headerHash)
    {
        if (headerHash is null || headerHash.Length == 0)
            return true;

        string expectedHex = Convert.ToHexString(headerHash);
        string? storedHex = ReadContextProperty(graph, propertyKey);

        return !string.IsNullOrEmpty(storedHex)
               && string.Equals(storedHex.Trim(), expectedHex, StringComparison.OrdinalIgnoreCase);
    }

    private static string? ReadContextProperty(GraphSnapshot graph, string key)
    {
        GraphNode? contextNode = graph.Nodes
            .FirstOrDefault(node => string.Equals(node.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        if (contextNode?.Properties is null)
            return null;

        return contextNode.Properties.TryGetValue(key, out string? value) ? value : null;
    }
}
