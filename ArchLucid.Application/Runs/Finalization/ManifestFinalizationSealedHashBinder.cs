using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Reseals <see cref="ManifestDocument.ManifestHash" /> after commit-time hasher-bound fields are applied.
/// </summary>
internal static class ManifestFinalizationSealedHashBinder
{
    public static SaveContractsManifestOptions Bind(
        SaveContractsManifestOptions keying,
        ManifestDocument model,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(keying);
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        // Pipeline hashes before ArchitectureVersionId, create-time pins, inventory, and
        // receipt are bound. Persist must reseal or first-finalize 409s on sealed-hash
        // mismatch (golden-cohort nightly after κ pin).
        string sealedHash = manifestHashService.ComputeHash(model);
        model.ManifestHash = sealedHash;
        return keying.WithPrecomputedManifestHash(sealedHash);
    }
}
