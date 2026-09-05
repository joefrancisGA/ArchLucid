namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Hands off failed audit evaluations to operational security findings (IE-09 ingest seam).</summary>
public sealed class AuditEvaluationFindingHandoffRequest
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid? AssessmentId
    {
        get;
        init;
    }

    public Guid? ControlId
    {
        get;
        init;
    }

    public Guid InventoryDiffId
    {
        get;
        init;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public string SourceSystem { get; init; } = "ArchLucid.AuditEval";
}

public interface IAuditEvaluationFindingHandoffService
{
    Task<bool> TryHandoffAsync(
        AuditEvaluationFindingHandoffRequest request,
        CancellationToken cancellationToken = default);
}
