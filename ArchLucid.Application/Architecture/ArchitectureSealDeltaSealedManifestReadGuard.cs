using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Wave-60 suggestion 706: seal-delta read fail-closed when latest sealed manifest hash does not verify.
/// </summary>
public static class ArchitectureSealDeltaSealedManifestReadGuard
{
    public static async Task EnsureSealDeltaReadAllowedOrThrowAsync(
        ScopeContext scope,
        Guid architectureId,
        IArchitectureIdentityService architectureIdentityService,
        IRunRepository runRepository,
        IGoldenManifestRepository goldenManifestRepository,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(architectureIdentityService);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(goldenManifestRepository);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        ArchitectureIdentityDetail? detail = await architectureIdentityService
            .GetIdentityAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (detail is null)
            return;

        await ArchitectureIdentitySealedManifestReadGuard.EnsureLatestSealedManifestReadAllowedOrThrowAsync(
            scope,
            architectureId,
            detail.LatestSealedManifestId,
            runRepository,
            goldenManifestRepository,
            manifestHashService,
            cancellationToken);
    }
}
