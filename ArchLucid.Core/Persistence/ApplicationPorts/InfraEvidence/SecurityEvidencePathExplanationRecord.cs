using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidencePathExplanationRecord
{
    public Guid ExplanationId
    {
        get;
        init;
    }

    public Guid PathId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string ExecutiveSummary
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> BusinessImpactHypotheses
    {
        get;
        init;
    } = [];

    public SecurityEvidencePathProposedRemediation ProposedRemediation
    {
        get;
        init;
    } = new();

    public IReadOnlyList<string> CitedEvidenceRefs
    {
        get;
        init;
    } = [];

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string? SimulatorLabel
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
