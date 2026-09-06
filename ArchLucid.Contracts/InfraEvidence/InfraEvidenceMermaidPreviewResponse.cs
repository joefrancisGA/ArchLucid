namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidPreviewResponse
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public List<InfraEvidenceMermaidModePreview> Modes
    {
        get;
        set;
    } = [];
}
