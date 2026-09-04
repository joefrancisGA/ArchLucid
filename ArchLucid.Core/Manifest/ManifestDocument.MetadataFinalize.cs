using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Core.Manifest;

public partial class ManifestDocument
{
    public ManifestMetadata Metadata
    {
        get;
        set;
    } = new();

    public List<string> Assumptions
    {
        get;
        set;
    } = [];

    public List<string> Warnings
    {
        get;
        set;
    } = [];

    public ManifestProvenance Provenance
    {
        get;
        set;
    } = new();

    /// <summary>Wave-13 suggestion 124: immutable artifact inventory sealed at commit.</summary>
    public List<CommittedArtifactInventoryEntry> CommittedArtifactInventory
    {
        get;
        set;
    } = [];

    /// <summary>Wave-15 suggestion 150: canonical decision receipt hash bound into Hasher A v10.</summary>
    public string? CommittedDecisionReceiptHashSha256
    {
        get;
        set;
    }
}
