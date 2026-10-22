using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditControlEvaluationService
{
    Task<AuditControlEvaluationResult> TryEvaluateControlAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid frameworkId,
        Guid controlId,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        CancellationToken cancellationToken = default);

    Task<AuditControlEvaluationResult> TryEvaluateControlForCurrentAssessmentAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        Guid frameworkId,
        Guid controlId,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        CancellationToken cancellationToken = default);
}

public sealed class AuditControlEvaluationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public AuditControlEvaluationRecord? Evaluation
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvidenceItemRecord> EvidenceItems
    {
        get;
        init;
    } = [];
}
