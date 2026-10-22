using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-23 suggestion 223: policy-pack simulate/dry-run fail-closed unless target run sealed <see cref="ManifestDocument.ManifestHash"/> verifies.</summary>
public static class PolicyPackSimulateSealedManifestGuard
{
    public static void EnsureRunSealedManifestHashOrThrow(
        ManifestDocument? goldenManifest,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (goldenManifest is null)
        {
            throw new ConflictException(
                $"Policy pack simulate blocked for run '{runIdLabel}': committed golden manifest is missing.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            goldenManifest,
            runIdLabel,
            manifestHashService);
    }
}
