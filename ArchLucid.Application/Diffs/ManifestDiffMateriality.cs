namespace ArchLucid.Application.Diffs;

/// <summary>
///     Shared materiality checks for <see cref="ManifestDiffResult" /> used by determinism checks,
///     interpretation notes, and sponsor export key counts.
/// </summary>
public static class ManifestDiffMateriality
{
    public static bool HasMaterialChanges(ManifestDiffResult manifestDiff)
    {
        ArgumentNullException.ThrowIfNull(manifestDiff);

        return manifestDiff.AddedServices.Count > 0 || manifestDiff.RemovedServices.Count > 0 ||
               manifestDiff.AddedDatastores.Count > 0 || manifestDiff.RemovedDatastores.Count > 0 ||
               manifestDiff.AddedRequiredControls.Count > 0 || manifestDiff.RemovedRequiredControls.Count > 0 ||
               manifestDiff.AddedRelationships.Count > 0 || manifestDiff.RemovedRelationships.Count > 0 ||
               manifestDiff.Warnings.Count > 0;
    }

    public static string FormatSponsorKeyCountsLine(ManifestDiffResult manifestDiff)
    {
        ArgumentNullException.ThrowIfNull(manifestDiff);

        return $"+{manifestDiff.AddedServices.Count} / -{manifestDiff.RemovedServices.Count} services; " +
               $"+{manifestDiff.AddedDatastores.Count} / -{manifestDiff.RemovedDatastores.Count} datastores; " +
               $"+{manifestDiff.AddedRelationships.Count} / -{manifestDiff.RemovedRelationships.Count} relationships; " +
               $"+{manifestDiff.AddedRequiredControls.Count} / -{manifestDiff.RemovedRequiredControls.Count} required controls; " +
               $"{manifestDiff.Warnings.Count} manifest warning(s)";
    }
}
