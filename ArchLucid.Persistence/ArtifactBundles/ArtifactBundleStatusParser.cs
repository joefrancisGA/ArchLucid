
namespace ArchLucid.Persistence.ArtifactBundles;

internal static class ArtifactBundleStatusParser
{
    internal static ArtifactBundleStatus Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return ArtifactBundleStatus.Available; // Legacy missing value only.

        return ArchLucid.Contracts.Serialization.DefinedEnum.Parse<ArtifactBundleStatus>(raw.Trim(), ignoreCase: true);
    }
}

