using ArchLucid.Core.Manifest;
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
}
