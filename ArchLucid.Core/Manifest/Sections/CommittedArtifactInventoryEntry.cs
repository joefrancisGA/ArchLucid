namespace ArchLucid.Core.Manifest.Sections;

/// <summary>
///     Wave-13 suggestion 124: immutable artifact inventory row sealed on the committed manifest.
/// </summary>
public sealed class CommittedArtifactInventoryEntry
{
    public string ArtifactName
    {
        get;
        set;
    } = null!;

    public string ContentType
    {
        get;
        set;
    } = null!;

    public string ContentHashSha256
    {
        get;
        set;
    } = null!;

    public string Producer
    {
        get;
        set;
    } = null!;

    /// <summary>Deterministic commit anchor (run create UTC), not wall-clock at capture.</summary>
    public DateTime CapturedUtc
    {
        get;
        set;
    }
}
