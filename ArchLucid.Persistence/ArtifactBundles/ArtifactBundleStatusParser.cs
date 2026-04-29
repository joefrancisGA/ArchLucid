using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.Persistence.ArtifactBundles;

internal static class ArtifactBundleStatusParser
{
    internal static ArtifactBundleStatus Parse(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw) && Enum.TryParse(raw.Trim(), true, out ArtifactBundleStatus st))
            return st;

        return ArtifactBundleStatus.Available;
    }
}
