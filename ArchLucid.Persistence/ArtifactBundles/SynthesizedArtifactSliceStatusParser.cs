using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.Persistence.ArtifactBundles;

internal static class SynthesizedArtifactSliceStatusParser
{
    internal static SynthesizedArtifactGenerationStatus Parse(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw)
            && Enum.TryParse(raw.Trim(), true, out SynthesizedArtifactGenerationStatus st))
            return st;

        return SynthesizedArtifactGenerationStatus.Generated;
    }
}
