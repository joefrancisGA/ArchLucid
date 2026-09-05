using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Records audit-evaluation finding handoff intent until IE-09 operational ingest is wired.</summary>
public sealed class NoOpAuditEvaluationFindingHandoffService(
    ILogger<NoOpAuditEvaluationFindingHandoffService> logger) : IAuditEvaluationFindingHandoffService
{
    public Task<bool> TryHandoffAsync(
        AuditEvaluationFindingHandoffRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        logger.LogInformation(
            "Audit evaluation finding handoff queued for AssessmentId={AssessmentId} ControlId={ControlId} DiffId={DiffId}.",
            request.AssessmentId,
            request.ControlId,
            request.InventoryDiffId);

        return Task.FromResult(true);
    }
}
