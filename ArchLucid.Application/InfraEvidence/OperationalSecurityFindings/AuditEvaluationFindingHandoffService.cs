using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;

/// <summary>Maps failed audit evaluations into operational security findings via IE-09 ingest.</summary>
public sealed class AuditEvaluationFindingHandoffService(
    IScopeContextProvider scopeContextProvider,
    IOperationalSecurityFindingIngestService ingestService,
    ILogger<AuditEvaluationFindingHandoffService> logger) : IAuditEvaluationFindingHandoffService
{
    public async Task<bool> TryHandoffAsync(
        AuditEvaluationFindingHandoffRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.TenantId == Guid.Empty)
            return false;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId != request.TenantId)
        {
            logger.LogWarning(
                "Audit evaluation finding handoff rejected due to tenant mismatch. RequestTenant={RequestTenant} ScopeTenant={ScopeTenant}.",
                request.TenantId,
                scope.TenantId);

            return false;
        }

        string sourceFindingId = BuildSourceFindingId(request);
        string title = string.IsNullOrWhiteSpace(request.Summary)
            ? "Audit evaluation requires attention"
            : request.Summary.Trim();

        OperationalSecurityFindingBatchIngestResult result = await ingestService.IngestBatchAsync(
            scope,
            [
                new OperationalSecurityFindingIngestItem
                {
                    Provider = CloudProvider.Azure,
                    SourceSystem = request.SourceSystem,
                    SourceFindingId = sourceFindingId,
                    ControlId = request.ControlId?.ToString("D"),
                    Title = title,
                    Description = request.Summary,
                    Severity = "Medium",
                    Status = OperationalSecurityFindingStatus.Open,
                    AssessmentId = request.AssessmentId,
                    InventoryDiffId = request.InventoryDiffId,
                    AuditEvidenceSnapshotId = request.AuditEvidenceSnapshotId,
                    Metadata = new Dictionary<string, string?>
                    {
                        ["handoffKind"] = "auditEvaluation",
                    },
                },
            ],
            request.SourceSystem,
            cancellationToken);

        OperationalSecurityFindingIngestItemResult? itemResult = result.Items.FirstOrDefault();

        if (itemResult is not { Succeeded: true })
        {
            logger.LogWarning(
                "Audit evaluation finding handoff failed for AssessmentId={AssessmentId} ControlId={ControlId}.",
                request.AssessmentId,
                request.ControlId);

            return false;
        }

        return true;
    }

    private static string BuildSourceFindingId(AuditEvaluationFindingHandoffRequest request) =>
        $"{request.AssessmentId:N}:{request.ControlId:N}:{request.InventoryDiffId:N}:{request.AuditEvidenceSnapshotId:N}";
}
