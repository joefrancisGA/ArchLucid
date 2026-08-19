using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Decisioning.Manifest;

/// <summary>
///     Maps authority <see cref="ManifestDocument.Metadata.Version" /> to the coordinator contract
///     <c>ManifestMetadata.ManifestVersion</c> string used on commit and in <c>dbo.Runs.CurrentManifestVersion</c>.
/// </summary>
public static class AuthorityCommitManifestVersionRules
{
    /// <summary>
    ///     Resolves the v-prefixed manifest version clients receive from commit and that
    ///     <c>dbo.sp_FinalizeManifest</c> expects when anchors were pre-sealed at request time.
    /// </summary>
    public static string ResolveContractManifestVersion(ManifestDocument source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return ResolveContractManifestVersion(source.Metadata);
    }

    /// <summary>Same normalization as <see cref="ResolveContractManifestVersion(ManifestDocument)" />.</summary>
    public static string ResolveContractManifestVersion(ManifestMetadata metadata)
    {
        ArgumentNullException.ThrowIfNull(metadata);

        if (string.IsNullOrWhiteSpace(metadata.Version))
            return "v1";

        string trimmed = metadata.Version.Trim();

        return trimmed.StartsWith('v') || trimmed.StartsWith('V')
            ? trimmed
            : $"v{trimmed}";
    }
}
