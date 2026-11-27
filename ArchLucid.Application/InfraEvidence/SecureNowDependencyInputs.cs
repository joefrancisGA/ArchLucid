using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Resolves the concrete inputs required by the scoped SecureNow incremental coordinator.</summary>
public sealed class SecureNowDependencyInputs(
    AnalysisDependencyConfiguration configuration,
    IAzureInventorySnapshotRepository snapshots,
    ISecurityEvidencePathRepository paths,
    ISecurityEvidencePathSearchCoverageRepository searchCoverage,
    ISecurityAssetAssertionResolver assertions,
    ISecurityEvidencePathRankRepository ranks,
    IRemediationPatternRepository remediationPatterns,
    IAnalysisRecoveryRepository checkpoints,
    IArchitectureDiagramReconciliationRepository reconciliations,
    TimeProvider clock)
{
    internal async Task<SecureNowDependencyVersions> ConfigurationAsync(ProjectScopeKey scope, Guid snapshotId, CancellationToken ct)
    {
        var assertionIds = await assertions.GetActiveCrownJewelAssertionIdsAsync(scope, clock.UtcNowDateTime(), ct);
        var weights = await ranks.TryGetWeightsAsync(scope.TenantId, ct);
        var patterns = await remediationPatterns.ListApprovedVersionsForTenantAsync(scope.TenantId, ct);

        var diagrams = await reconciliations.ListBySnapshotAsync(scope.TenantId, snapshotId, ct);
        string pathsVersion = AnalysisDependencyFingerprint.Digest(new
        {
            Engine = typeof(SecureNowDependencyInputs).Module.ModuleVersionId,
            Settings = configuration.ForSecureNow()
        });
        string ranking = AnalysisDependencyFingerprint.Digest(new { Paths = pathsVersion, Assertions = assertionIds.Order().ToArray(), Weights = weights });
        string cuts = AnalysisDependencyFingerprint.Digest(new
        {
            Ranking = ranking,
            Patterns = patterns.Select(item => AnalysisDependencyFingerprint.Digest(item)).Order(StringComparer.Ordinal).ToArray()
        });
        string drift = AnalysisDependencyFingerprint.Digest(new
        {
            Paths = pathsVersion,
            Diagrams = diagrams.Select(item => AnalysisDependencyFingerprint.Digest(item)).Order(StringComparer.Ordinal).ToArray()
        });

        return new SecureNowDependencyVersions(pathsVersion, ranking, cuts, drift);
    }

    internal async Task<string?> CarryForwardRejectionAsync(ScopeContext scope, AzureInventorySnapshotRecord target,
        Guid sourceId, string version, int maxAgeHours, CancellationToken ct)
    {
        AzureInventorySnapshotRecord? source = await snapshots.TryGetBySnapshotIdAsync(scope, sourceId, ct);

        if (source is null || !Eligible(source, maxAgeHours) || !Eligible(target, maxAgeHours))
            return "incomplete_or_stale_inventory";

        if (!string.Equals(source.SubscriptionId, target.SubscriptionId, StringComparison.OrdinalIgnoreCase)
            || !source.ContentHashSha256!.SequenceEqual(target.ContentHashSha256!))
            return "changed_inventory";

        var key = new AnalysisRecoveryStageKey(ProjectScopeKey.From(scope), "securenow", sourceId, "job");
        AnalysisRecoveryClaim? predecessor = await checkpoints.ReadAsync(key, ct);

        if (predecessor is not { State: "succeeded", ResultReference: { } reference } ||
            !reference.StartsWith('{'))
            return "source_lineage_missing";

        SecureNowDependencyReceipt? receipt;

        try
        {
            receipt = JsonSerializer.Deserialize<SecureNowDependencyReceipt>(reference);
        }
        catch (JsonException)
        {
            return "source_lineage_missing";
        }

        if (receipt is not { Schema: 2 } || receipt.SnapshotId != sourceId ||
            !string.Equals(receipt.Configuration, version, StringComparison.Ordinal) ||
            !string.Equals(receipt.Evidence, Evidence(source), StringComparison.Ordinal))
            return "source_lineage_incompatible";

        string? witness = await PathWitnessAsync(scope, sourceId, ct);

        return witness is not null && witness == receipt.Paths ? null : "source_outputs_missing_or_changed";
    }

    internal async Task<SecureNowDependencyReceipt?> CreateReceiptAsync(ScopeContext scope,
        AzureInventorySnapshotRecord snapshot, string version, int maxAgeHours, bool complete, CancellationToken ct)
    {
        if (!complete || !Eligible(snapshot, maxAgeHours))
            return null;

        string? witness = await PathWitnessAsync(scope, snapshot.SnapshotId, ct);

        return witness is null ? null : new SecureNowDependencyReceipt(2, snapshot.SnapshotId, Evidence(snapshot), version, witness);
    }

    // Capture time is part of each execution binding, but not exact cross-snapshot evidence equivalence.
    internal static string Evidence(AzureInventorySnapshotRecord snapshot) => AnalysisDependencyFingerprint.Digest(new
    {
        snapshot.SubscriptionId, snapshot.ContentHashSha256, snapshot.CaptureVersion, snapshot.CollectorVersion,
        snapshot.CaptureStatus, snapshot.ErrorCount, snapshot.WarningCount, snapshot.CompletenessScore
    });

    internal bool Eligible(AzureInventorySnapshotRecord snapshot, int maxAgeHours)
    {
        DateTime now = clock.UtcNowDateTime();

        return snapshot is { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, ErrorCount: 0, WarningCount: 0,
                   CompletenessScore: 1m, ContentHashSha256.Length: 32, CapturedUtc: DateTime captured }
               && captured <= now && now - captured < TimeSpan.FromHours(Math.Clamp(maxAgeHours, 1, 720));
    }

    private async Task<string?> PathWitnessAsync(ScopeContext scope, Guid snapshotId, CancellationToken ct)
    {
        if ((await searchCoverage.ListBySnapshotAsync(scope, snapshotId, ct)).Count != 0)
            return null;

        IReadOnlyList<SecurityEvidencePathWithHops> source = await paths.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(ProjectScopeKey.From(scope), snapshotId), ct);

        return AnalysisDependencyFingerprint.Digest(source.Where(row => CarryForwardPathKind(row.Path.PathKind)).OrderBy(row => row.Path.PathId)
            .Select(row => new { row.Path.PathId, row.Path.CanonicalHopHashSha256, row.Path.PathKind,
                row.Path.CrownJewelAssertionId, row.Path.PathConfidenceBand,
                Hops = row.Hops.OrderBy(hop => hop.HopOrdinal).ToArray() }).ToArray());
    }

    internal static bool CarryForwardPathKind(PathKind kind) => kind is PathKind.Privilege or PathKind.IntendedReachability
        or PathKind.ToxicCombination or PathKind.CapabilityToFlow or PathKind.SharedControlBlastRadius;
}
