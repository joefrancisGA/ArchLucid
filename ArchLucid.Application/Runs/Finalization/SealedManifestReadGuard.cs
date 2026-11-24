using ArchLucid.Application;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Wave-21 suggestion 208: public read-path guard for sealed manifest hash verification.</summary>
public static class SealedManifestReadGuard
{
    public static void EnsureSealedManifestHashMatchesOrThrow(
        ManifestDocument manifest,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            manifest,
            runIdLabel,
            manifestHashService);
    }

    /// <summary>
    /// Verify that a scoped manifest summary is bound to the exact requested
    /// sealed document and to a valid current pinned manifest for the same run.
    /// Historical manifest IDs are allowed, but their own seals must match.
    /// This checks integrity only: the HTTP consumer must authorize the run
    /// before reading full summary/detail/manifest material.
    /// </summary>
    public static void EnsureManifestSummaryBindingAndHashesOrThrow(
        ScopeContext scope,
        Guid requestedManifestId,
        ManifestSummaryDto summary,
        ManifestDocument? requestedManifest,
        RunDetailDto? runDetail,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (summary.ManifestId != requestedManifestId || summary.RunId == Guid.Empty)
        {
            throw new ConflictException(
                $"Manifest '{requestedManifestId}' summary identity or run is invalid.");
        }

        if (runDetail?.Run is null ||
            runDetail.Run.RunId != summary.RunId ||
            runDetail.GoldenManifest is null ||
            runDetail.Run.GoldenManifestId != runDetail.GoldenManifest.ManifestId ||
            runDetail.GoldenManifest.RunId != summary.RunId)
        {
            throw new ConflictException(
                $"Manifest '{requestedManifestId}' cannot verify its associated committed run.");
        }

        ManifestDocument pinnedManifest = runDetail.GoldenManifest;
        if (requestedManifest is null ||
            requestedManifest.ManifestId != requestedManifestId ||
            requestedManifest.RunId != summary.RunId ||
            requestedManifest.TenantId != scope.TenantId ||
            requestedManifest.WorkspaceId != scope.WorkspaceId ||
            requestedManifest.ProjectId != scope.ProjectId ||
            !string.Equals(requestedManifest.ManifestHash, summary.ManifestHash,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException(
                $"Manifest '{requestedManifestId}' exact-ID scope or run binding could not be verified.");
        }

        EnsureSealedManifestHashMatchesOrThrow(
            requestedManifest, summary.RunId.ToString("D"), manifestHashService);

        // When the current and requested IDs match, consumers pass the same
        // hydrated instance and avoid a duplicate query/hash. If not, both
        // documents must be valid; never verify only the run's current seal.
        if (!ReferenceEquals(requestedManifest, pinnedManifest))
        {
            if (requestedManifest.ManifestId == pinnedManifest.ManifestId &&
                !string.Equals(requestedManifest.ManifestHash, pinnedManifest.ManifestHash,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException(
                    $"Manifest '{requestedManifestId}' conflicts with the run's pinned manifest.");
            }

            EnsureSealedManifestHashMatchesOrThrow(
                pinnedManifest, summary.RunId.ToString("D"), manifestHashService);
        }
    }

}
