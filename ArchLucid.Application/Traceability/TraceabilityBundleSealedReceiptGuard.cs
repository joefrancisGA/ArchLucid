using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Traceability;

/// <summary>Wave-24 suggestion 234: traceability bundle ZIP fail-closed on sealed manifest hash and export receipt.</summary>
public static class TraceabilityBundleSealedReceiptGuard
{
    public static async Task EnsureVerifiedOrThrowAsync(
        Guid runId,
        string runIdLabel,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Traceability bundle blocked for run '{runIdLabel}': committed golden manifest is missing.");
        }

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runIdLabel,
            manifestHashService);

        await ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
            runId,
            runIdLabel,
            authorityQueryService,
            manifestHashService,
            scope,
            cancellationToken);
    }
}
