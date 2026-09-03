namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-14 suggestion 133: canonical UTF-8 bytes hashed into committed artifact inventory rows.
/// </summary>
public sealed class ManifestCommittedArtifactInventoryMaterial
{
    public required byte[] GoldenManifestUtf8
    {
        get;
        init;
    }

    public required byte[] FindingsSnapshotUtf8
    {
        get;
        init;
    }

    public required byte[] DecisionTraceUtf8
    {
        get;
        init;
    }

    public byte[]? ArtifactBundleUtf8
    {
        get;
        init;
    }
}
