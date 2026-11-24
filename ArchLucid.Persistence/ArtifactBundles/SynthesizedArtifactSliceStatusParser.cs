
namespace ArchLucid.Persistence.ArtifactBundles;

internal static class SynthesizedArtifactSliceStatusParser
{
    internal static SynthesizedArtifactGenerationStatus Parse(string? raw)
    {
        return ArchLucid.Contracts.Serialization.DefinedEnum.Parse<SynthesizedArtifactGenerationStatus>(raw?.Trim() ?? string.Empty, ignoreCase: true);
    }
}

