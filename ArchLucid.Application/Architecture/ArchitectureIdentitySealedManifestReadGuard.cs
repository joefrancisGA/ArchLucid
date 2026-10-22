using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Fail-closed read guard when an architecture identity cites a latest sealed golden manifest.
/// </summary>
public static class ArchitectureIdentitySealedManifestReadGuard
{
    public static async Task EnsureLatestSealedManifestReadAllowedOrThrowAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid? latestSealedManifestId,
        IRunRepository runRepository,
        IGoldenManifestRepository goldenManifestRepository,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(goldenManifestRepository);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!latestSealedManifestId.HasValue)
            return;

        Guid? sealedReviewRunId = await runRepository
            .GetCommittedRunIdByGoldenManifestIdAsync(
                scope,
                architectureId,
                latestSealedManifestId.Value,
                Guid.Empty,
                cancellationToken)
            .ConfigureAwait(false);

        ManifestDocument? sealedManifest = await goldenManifestRepository
            .GetByIdAsync(scope, latestSealedManifestId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (sealedManifest is null)
            return;

        string sealedManifestRunIdLabel = sealedReviewRunId?.ToString("D")
            ?? latestSealedManifestId.Value.ToString("D");

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
            sealedManifest,
            sealedManifestRunIdLabel,
            manifestHashService);
    }
}
