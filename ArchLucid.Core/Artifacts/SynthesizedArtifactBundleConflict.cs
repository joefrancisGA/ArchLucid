using ArchLucid.Contracts.Persistence.Artifacts;

namespace ArchLucid.Core.Artifacts;

/// <summary>
///     Duplicate <see cref="SynthesizedArtifact.ArtifactId" /> rows
///     whose <c>ContentHash</c> values disagree (data-integrity signal).
/// </summary>
public sealed class SynthesizedArtifactBundleConflict
{
    public Guid ArtifactId
    {
        get;
        init;
    }

    public IReadOnlyList<string> ContentHashes
    {
        get;
        init;
    } = [];
}
