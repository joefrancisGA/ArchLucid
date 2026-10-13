using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceLineageEvaluationNode
{
    public Guid EvaluationId
    {
        get;
        init;
    }

    public AuditEvaluationOutcome Outcome
    {
        get;
        init;
    }

    public string Formula
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> ExceptionIds
    {
        get;
        init;
    } = [];

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }
}
