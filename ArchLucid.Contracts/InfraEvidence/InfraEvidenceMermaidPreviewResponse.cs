using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidPreviewResponse
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    private List<InfraEvidenceMermaidModePreview> modes = [];

    public List<InfraEvidenceMermaidModePreview> Modes
    {
        get => modes;
        set => modes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> completenessWarnings = [];

    public List<string> CompletenessWarnings
    {
        get => completenessWarnings;
        set => completenessWarnings = ContractCollectionDefaults.Coalesce(value);
    }
}
