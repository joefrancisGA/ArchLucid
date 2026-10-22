using ArchLucid.Core.Manifest;

namespace ArchLucid.Persistence.Coordination.Replay;

/// <summary>Wave-26 suggestion 257: internal authority replay fail-closed before rebuild when sealed hash does not verify.</summary>
public static class AuthorityReplaySealedManifestHashGuard
{
    public static void EnsureRunSealedManifestHashOrThrow(
        ManifestDocument? goldenManifest,
        string runId,
        IManifestHashService manifestHashService)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (goldenManifest is null)
        {
            throw new InvalidOperationException(
                $"Authority replay blocked for run '{runId}': committed golden manifest is missing.");
        }

        string computedHash = manifestHashService.ComputeHash(goldenManifest);

        if (!string.Equals(computedHash, goldenManifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Authority replay blocked for run '{runId}': sealed manifest hash does not verify.");
        }
    }
}
