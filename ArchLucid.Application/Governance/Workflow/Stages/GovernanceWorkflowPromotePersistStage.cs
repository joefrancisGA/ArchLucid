using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.Workflow.Stages;

public sealed class GovernanceWorkflowPromotePersistStage(
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IBaselineMutationAuditService baselineMutationAudit,
    GovernanceWorkflowAuditSupport auditSupport,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    ILogger<GovernanceWorkflowPromotePersistStage> logger) : IGovernanceWorkflowPromotePersistStage
{
    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IGovernancePromotionRecordRepository _promotionRepo =
        promotionRepo ?? throw new ArgumentNullException(nameof(promotionRepo));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly GovernanceWorkflowAuditSupport _auditSupport =
        auditSupport ?? throw new ArgumentNullException(nameof(auditSupport));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly ILogger<GovernanceWorkflowPromotePersistStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<GovernancePromotionRecord> PersistAsync(
        GovernanceWorkflowPromoteValidatedContext validated,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(validated);
        GovernancePromotionRecord record = validated.Record;

        if (validated.DryRun)
        {
            await _auditSupport.LogDryRunValidationAttemptedForPromotionAsync(
                validated.PromotedBy,
                validated.PersistedRunId,
                validated.ManifestVersion,
                validated.SourceEnvironment,
                validated.TargetEnvironment,
                record.ApprovalRequestId,
                cancellationToken);
            return record;
        }

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            if (validated.ProdApprovalToMarkPromoted is not null)
            {
                validated.ProdApprovalToMarkPromoted.Status = GovernanceApprovalStatus.Promoted;

                if (uow.SupportsExternalTransaction)
                    await _approvalRepo.UpdateAsync(validated.ProdApprovalToMarkPromoted, cancellationToken, uow.Connection, uow.Transaction);
                else
                    await _approvalRepo.UpdateAsync(validated.ProdApprovalToMarkPromoted, cancellationToken);
            }

            if (uow.SupportsExternalTransaction)
                await _promotionRepo.CreateAsync(record, cancellationToken, uow.Connection, uow.Transaction);
            else
                await _promotionRepo.CreateAsync(record, cancellationToken);

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Governance.ManifestPromoted,
            validated.PromotedBy,
            record.PromotionRecordId,
            $"RunId={validated.PersistedRunId}; ManifestVersion={validated.ManifestVersion}; {validated.SourceEnvironment}->{validated.TargetEnvironment}",
            cancellationToken);

        Guid? promotedRunId = Guid.TryParse(record.RunId, out Guid promotedRunGuid) ? promotedRunGuid : null;
        AuditEvent governancePromoted = _auditSupport.CreateGovernanceManifestPromotedAuditEvent(record, validated.PromotedBy);
        governancePromoted.RunId = promotedRunId;
        await _auditSupport.LogGovernanceDurableWithRetryAsync(
            governancePromoted,
            $"GovernanceManifestPromoted:{LogSanitizer.Sanitize(record.PromotionRecordId)}",
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformationGovernanceManifestPromoted(record.PromotionRecordId, record.RunId, record.ManifestVersion, record.TargetEnvironment);

        return record;
    }
}
