
namespace ArchLucid.Persistence.ArtifactBundles;

internal static class ArtifactBundleStatusParser
{
    internal static ArtifactBundleStatus Parse(string? raw)
    {
        return ArchLucid.Contracts.Serialization.DefinedEnum.Parse<ArtifactBundleStatus>(raw?.Trim() ?? string.Empty, ignoreCase: true);
    }
}

