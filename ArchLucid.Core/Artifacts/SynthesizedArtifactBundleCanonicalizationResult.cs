using ArchLucid.Contracts.Persistence.Artifacts;

namespace ArchLucid.Core.Artifacts;

public sealed class SynthesizedArtifactBundleCanonicalizationResult
{
    public required IReadOnlyList<SynthesizedArtifact> Artifacts
    {
        get;
        init;
    }

    public IReadOnlyList<SynthesizedArtifactBundleConflict> Conflicts
    {
        get;
        init;
    } = [];
}
