using ArchLucid.Core.Manifest;

namespace ArchLucid.Persistence.Alerts.Simulation;

/// <summary>Wave-26 suggestions 259–261 / wave-27: alert simulation fail-closed on sealed hash for primary and compare-to runs.</summary>
public static class AlertSimulationSealedManifestHashGuard
{
    public static bool TryEnsureRunSealedManifestHash(
        ManifestDocument? goldenManifest,
        Guid runId,
        IManifestHashService manifestHashService)
    {
        try
        {
            EnsureRunSealedManifestHashOrThrow(goldenManifest, runId, manifestHashService);

            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    public static void EnsureRunSealedManifestHashOrThrow(
        ManifestDocument? goldenManifest,
        Guid runId,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (goldenManifest is null)
        {
            throw new InvalidOperationException(
                $"Alert simulation blocked for run '{runId:D}': committed golden manifest is missing.");
        }

        string computedHash = manifestHashService.ComputeHash(goldenManifest);

        if (!string.Equals(computedHash, goldenManifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Alert simulation blocked for run '{runId:D}': sealed manifest hash does not verify.");
        }
    }
}
