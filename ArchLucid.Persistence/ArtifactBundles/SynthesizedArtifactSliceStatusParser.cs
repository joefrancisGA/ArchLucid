
namespace ArchLucid.Persistence.ArtifactBundles;

internal static class SynthesizedArtifactSliceStatusParser
{
    internal static SynthesizedArtifactGenerationStatus Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return SynthesizedArtifactGenerationStatus.Generated; // Legacy missing value only.

        return ArchLucid.Contracts.Serialization.DefinedEnum.Parse<SynthesizedArtifactGenerationStatus>(raw.Trim(), ignoreCase: true);
    }
}

