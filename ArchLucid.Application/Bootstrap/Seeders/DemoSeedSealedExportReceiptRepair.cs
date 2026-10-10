using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>
///     Backfills sealed decision receipt fields on demo-seeded golden manifests so consulting export gates pass in CI.
/// </summary>
internal static class DemoSeedSealedExportReceiptRepair
{
    internal static async Task TryEnsureSealedExportReceiptFieldsAsync(
        DemoSeedSeederDependencies deps,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deps);
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? runDetail =
            await deps.AuthorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        ManifestDocument? golden = runDetail?.GoldenManifest;

        if (golden is null)
            return;

        string? manifestVersion = ResolveManifestVersion(golden, runDetail?.Run);

        if (string.IsNullOrWhiteSpace(manifestVersion))
            return;

        DecisionReceiptRunBuildOutcome? readiness =
            ManifestDecisionReceiptExportBinder.TryGetSealedReceiptReadinessOutcome(
                golden,
                golden.FeasibilityVerdict,
                manifestVersion);

        if (readiness is null)
            return;

        if (golden.FeasibilityVerdict is null)
        {
            golden.FeasibilityVerdict = deps.FeasibilityVerdictComposer.Compose(golden, intakeTransparencyTrail: null);
        }

        ManifestDecisionReceiptHashCapturer.ApplyToManifest(
            golden,
            runId,
            manifestVersion,
            deps.ManifestHashService);

        golden.ManifestHash = deps.ManifestHashService.ComputeHash(golden);

        await deps.GoldenManifestRepository.UpdateSealedHasherBoundSliceAsync(scope, golden, cancellationToken);
    }

    private static string? ResolveManifestVersion(ManifestDocument golden, RunRecord? run)
    {
        string? fromMetadata = golden.Metadata?.Version?.Trim();

        if (!string.IsNullOrWhiteSpace(fromMetadata))
            return fromMetadata;

        return run?.CurrentManifestVersion?.Trim();
    }
}
