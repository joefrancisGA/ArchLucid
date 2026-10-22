using ArchLucid.Application.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Advisory;

/// <summary>Wave-26 suggestion 271: advisory scan compare-to baseline run fail-closed on sealed hash.</summary>
public static class AdvisoryScanCompareToSealedManifestHashGuard
{
    public static void EnsureRunSealedManifestHashOrThrow(
        ManifestDocument? goldenManifest,
        Guid runId,
        IManifestHashService manifestHashService)
    {
        PolicyPackSimulateSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
            goldenManifest,
            runId.ToString("D"),
            manifestHashService);
    }
}
