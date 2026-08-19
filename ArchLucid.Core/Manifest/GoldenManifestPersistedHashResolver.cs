namespace ArchLucid.Core.Manifest;

/// <summary>
///     Resolves the persisted manifest hash, preferring a caller-supplied value from decisioning (TB-575).
/// </summary>
public static class GoldenManifestPersistedHashResolver
{
    /// <summary>
    ///     Uses <see cref="SaveContractsManifestOptions.PrecomputedManifestHash" /> when set; otherwise computes via
    ///     <paramref name="manifestHashService" />.
    /// </summary>
    public static string Resolve(
        SaveContractsManifestOptions keying,
        ManifestDocument model,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(keying);
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!string.IsNullOrWhiteSpace(keying.PrecomputedManifestHash))
            return keying.PrecomputedManifestHash;

        return manifestHashService.ComputeHash(model);
    }
}
