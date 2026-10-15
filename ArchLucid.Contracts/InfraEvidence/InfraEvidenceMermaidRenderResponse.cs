using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidRenderResponse
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public string Mode
    {
        get;
        set;
    } = string.Empty;

    public string? FallbackKey
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string? Mermaid
    {
        get;
        set;
    }

    public string? FailureReason
    {
        get;
        set;
    }

    public InfraEvidenceMermaidComplexityMetrics? Metrics
    {
        get;
        set;
    }

    private List<InfraEvidenceMermaidFallbackArtifactSummary> fallbackArtifacts = [];

    public List<InfraEvidenceMermaidFallbackArtifactSummary> FallbackArtifacts
    {
        get => fallbackArtifacts;
        set => fallbackArtifacts = ContractCollectionDefaults.Coalesce(value);
    }

    public string? LayoutSvg
    {
        get;
        set;
    }

    public string? LayoutEngine
    {
        get;
        set;
    }

    public InfraEvidenceMermaidCollapseReport? CollapseReport
    {
        get;
        set;
    }

    public InfraEvidenceMermaidIdentityDiagramHints? IdentityDiagramHints
    {
        get;
        set;
    }

    private List<string> completenessWarnings = [];

    public List<string> CompletenessWarnings
    {
        get => completenessWarnings;
        set => completenessWarnings = ContractCollectionDefaults.Coalesce(value);
    }

    public InfraEvidenceMermaidCompletenessSummary? CompletenessSummary
    {
        get;
        set;
    }
}
