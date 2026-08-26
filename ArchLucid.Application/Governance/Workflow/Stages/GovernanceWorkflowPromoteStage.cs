using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <inheritdoc cref="IGovernanceWorkflowPromoteStage" />
public sealed class GovernanceWorkflowPromoteStage(
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IRunDetailQueryService runDetailQueryService,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IBaselineMutationAuditService baselineMutationAudit,
    GovernanceWorkflowAuditSupport auditSupport,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    ILogger<GovernanceWorkflowPromoteStage> logger) : IGovernanceWorkflowPromoteStage
{
    private const string OpaqueProdApprovalValidationFailed =
        "Promotion to prod requires an approved approval request that matches the provided run, manifest version, and target environment.";

    private const string OpaqueProdApprovalMismatch =
        "The approval request does not match the promoted run, manifest version, or target environment.";

    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IGovernancePromotionRecordRepository _promotionRepo =
        promotionRepo ?? throw new ArgumentNullException(nameof(promotionRepo));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly GovernanceWorkflowAuditSupport _auditSupport =
        auditSupport ?? throw new ArgumentNullException(nameof(auditSupport));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly ILogger<GovernanceWorkflowPromoteStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun,
        bool verbosePromotionValidationErrors,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(manifestVersion);
        ArgumentNullException.ThrowIfNull(sourceEnvironment);
        ArgumentNullException.ThrowIfNull(targetEnvironment);
        ArgumentNullException.ThrowIfNull(promotedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceEnvironment);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetEnvironment);
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedBy);

        ArchitectureRunDetail runDetail = await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken)
            ?? throw new RunNotFoundException(runId);
        ArchitectureRun run = runDetail.Run;
        string persistedRunId = run.RunId;

        GoldenManifest? manifest =
            runDetail.Manifest is not null
            && string.Equals(run.CurrentManifestVersion, manifestVersion, StringComparison.Ordinal)
                ? runDetail.Manifest
                : await _unifiedGoldenManifestReader.GetByVersionAsync(manifestVersion, cancellationToken)
                    .ConfigureAwait(false);

        if (manifest is null)
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        if (!string.Equals(manifest.RunId, runId, StringComparison.Ordinal))
            throw new GoldenManifestVersionNotFoundException(manifestVersion, runId);

        if (!GovernanceEnvironmentOrder.IsValidPromotion(sourceEnvironment, targetEnvironment))
        {
            throw new InvalidOperationException(
                $"Promotion must follow environment ordering (dev → test → prod). " +
                $"'{sourceEnvironment}' → '{targetEnvironment}' is not a valid promotion step.");
        }

        if (string.Equals(targetEnvironment, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(approvalRequestId))
        {
            throw new InvalidOperationException("Promotion to prod requires an approved approval request. Provide an approvalRequestId.");
        }

        GovernanceApprovalRequest? prodApprovalToMarkPromoted = null;
        if (!string.IsNullOrWhiteSpace(approvalRequestId))
        {
            GovernanceApprovalRequest? approvalRequest = await _approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);

            if (string.Equals(targetEnvironment, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase))
            {
                ThrowIfProdApprovalChainInvalid(approvalRequest, approvalRequestId, runId, manifestVersion, targetEnvironment, verbosePromotionValidationErrors);
                prodApprovalToMarkPromoted = approvalRequest!;
            }
            else
            {
                ThrowIfApprovalPromotionLinkageInvalid(
                    approvalRequest,
                    approvalRequestId,
                    runId,
                    manifestVersion,
                    targetEnvironment,
                    verbosePromotionValidationErrors);
            }
        }

        GovernancePromotionRecord record = new()
        {
            RunId = persistedRunId,
            ManifestVersion = manifestVersion,
            SourceEnvironment = sourceEnvironment,
            TargetEnvironment = targetEnvironment,
            PromotedBy = promotedBy,
            PromotedUtc = TimeProvider.System.UtcNowDateTime(),
            ApprovalRequestId = approvalRequestId,
            Notes = notes
        };
        _auditSupport.StampGovernanceScope(record);

        if (dryRun)
        {
            await _auditSupport.LogDryRunValidationAttemptedForPromotionAsync(
                promotedBy,
                persistedRunId,
                manifestVersion,
                sourceEnvironment,
                targetEnvironment,
                approvalRequestId,
                cancellationToken);
            return record;
        }

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            if (prodApprovalToMarkPromoted is not null)
            {
                prodApprovalToMarkPromoted.Status = GovernanceApprovalStatus.Promoted;

                if (uow.SupportsExternalTransaction)
                    await _approvalRepo.UpdateAsync(prodApprovalToMarkPromoted, cancellationToken, uow.Connection, uow.Transaction);
                else
                    await _approvalRepo.UpdateAsync(prodApprovalToMarkPromoted, cancellationToken);
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
            promotedBy,
            record.PromotionRecordId,
            $"RunId={persistedRunId}; ManifestVersion={manifestVersion}; {sourceEnvironment}->{targetEnvironment}",
            cancellationToken);

        Guid? promotedRunId = Guid.TryParse(record.RunId, out Guid promotedRunGuid) ? promotedRunGuid : null;
        AuditEvent governancePromoted = _auditSupport.CreateGovernanceManifestPromotedAuditEvent(record, promotedBy);
        governancePromoted.RunId = promotedRunId;
        await _auditSupport.LogGovernanceDurableWithRetryAsync(
            governancePromoted,
            $"GovernanceManifestPromoted:{LogSanitizer.Sanitize(record.PromotionRecordId)}",
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformationGovernanceManifestPromoted(record.PromotionRecordId, record.RunId, record.ManifestVersion, record.TargetEnvironment);

        return record;
    }

    private static bool SameArchitectureRunKey(string left, string right)
    {
        if (Guid.TryParse(left, out Guid leftGuid) && Guid.TryParse(right, out Guid rightGuid))
            return leftGuid == rightGuid;
        return string.Equals(left, right, StringComparison.Ordinal);
    }

    private void ThrowIfProdApprovalChainInvalid(
        GovernanceApprovalRequest? approvalRequest,
        string approvalRequestId,
        string runId,
        string manifestVersion,
        string targetEnvironment,
        bool verbosePromotionValidationErrors)
    {
        if (approvalRequest?.Status != GovernanceApprovalStatus.Approved)
        {
            if (verbosePromotionValidationErrors)
            {
                throw new InvalidOperationException(
                    $"Promotion to prod requires an approved approval request. " +
                    $"Approval request '{approvalRequestId}' has status '{approvalRequest?.Status ?? "not found"}'.");
            }

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Promotion to prod blocked: approval request {ApprovalRequestId} has status {Status} (expected Approved). CallerRunId={CallerRunId}, CallerManifestVersion={CallerManifestVersion}, TargetEnvironment={TargetEnvironment}.",
                    LogSanitizer.Sanitize(approvalRequestId),
                    approvalRequest?.Status ?? "not found",
                    LogSanitizer.Sanitize(runId),
                    LogSanitizer.Sanitize(manifestVersion),
                    LogSanitizer.Sanitize(targetEnvironment));
            }

            throw new InvalidOperationException(OpaqueProdApprovalValidationFailed);
        }

        ThrowIfApprovalPromotionLinkageInvalid(
            approvalRequest,
            approvalRequestId,
            runId,
            manifestVersion,
            targetEnvironment,
            verbosePromotionValidationErrors);
    }

    private void ThrowIfApprovalPromotionLinkageInvalid(
        GovernanceApprovalRequest? approvalRequest,
        string approvalRequestId,
        string runId,
        string manifestVersion,
        string targetEnvironment,
        bool verbosePromotionValidationErrors)
    {
        if (approvalRequest is null)
        {
            if (verbosePromotionValidationErrors)
            {
                throw new InvalidOperationException(
                    $"Approval request '{approvalRequestId}' was not found.");
            }

            throw new InvalidOperationException(OpaqueProdApprovalMismatch);
        }

        if (!SameArchitectureRunKey(approvalRequest.RunId, runId))
        {
            if (verbosePromotionValidationErrors)
            {
                throw new InvalidOperationException(
                    $"Approval request '{approvalRequestId}' was issued for run '{approvalRequest.RunId}', " +
                    $"not '{runId}'. Use an approval request that matches the promoted run.");
            }

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Promotion blocked: approval request {ApprovalRequestId} run mismatch (stored {StoredRunId}, caller {CallerRunId}).",
                    LogSanitizer.Sanitize(approvalRequestId),
                    LogSanitizer.Sanitize(approvalRequest.RunId),
                    LogSanitizer.Sanitize(runId));
            }

            throw new InvalidOperationException(OpaqueProdApprovalMismatch);
        }

        if (!string.Equals(approvalRequest.ManifestVersion, manifestVersion, StringComparison.Ordinal))
        {
            if (verbosePromotionValidationErrors)
            {
                throw new InvalidOperationException(
                    $"Approval request '{approvalRequestId}' was issued for manifest version '{approvalRequest.ManifestVersion}', " +
                    $"not '{manifestVersion}'. Use an approval request that matches the promoted manifest version.");
            }

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Promotion blocked: approval request {ApprovalRequestId} manifest mismatch (stored {StoredManifestVersion}, caller {CallerManifestVersion}).",
                    LogSanitizer.Sanitize(approvalRequestId),
                    LogSanitizer.Sanitize(approvalRequest.ManifestVersion),
                    LogSanitizer.Sanitize(manifestVersion));
            }

            throw new InvalidOperationException(OpaqueProdApprovalMismatch);
        }

        if (string.Equals(approvalRequest.TargetEnvironment, targetEnvironment, StringComparison.OrdinalIgnoreCase))
            return;

        if (verbosePromotionValidationErrors)
        {
            throw new InvalidOperationException(
                $"Approval request '{approvalRequestId}' targets environment '{approvalRequest.TargetEnvironment}', " +
                $"not '{targetEnvironment}'. Use an approval request that matches the target environment.");
        }

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Promotion blocked: approval request {ApprovalRequestId} target environment mismatch (stored {StoredTarget}, caller {CallerTarget}).",
                LogSanitizer.Sanitize(approvalRequestId),
                LogSanitizer.Sanitize(approvalRequest.TargetEnvironment),
                LogSanitizer.Sanitize(targetEnvironment));
        }

        throw new InvalidOperationException(OpaqueProdApprovalMismatch);
    }
}
