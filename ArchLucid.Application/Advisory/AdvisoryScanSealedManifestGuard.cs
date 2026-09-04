using ArchLucid.Application.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Advisory;

/// <summary>Wave-24 suggestion 232: advisory scan schedule fail-closed on sealed <see cref="ManifestDocument.ManifestHash"/>.</summary>
public static class AdvisoryScanSealedManifestGuard
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
