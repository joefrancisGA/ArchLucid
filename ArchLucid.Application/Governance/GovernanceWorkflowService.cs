using System.Data;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using GovernanceGateOptions = ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default implementation of <see cref = "IGovernanceWorkflowService"/> backed by
///     <see cref = "IGovernanceApprovalRequestRepository"/>,
///     <see cref = "IGovernancePromotionRecordRepository"/>, and
///     <see cref = "IGovernanceEnvironmentActivationRepository"/>.
/// </summary>
public sealed class GovernanceWorkflowService(
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IGovernanceEnvironmentActivationRepository activationRepo,
    IRunDetailQueryService runDetailQueryService,
    IBaselineMutationAuditService baselineMutationAudit,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IIntegrationEventPublisher integrationEventPublisher,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IOptions<GovernanceGateOptions> governanceGateOptions,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    ILogger<GovernanceWorkflowService> logger) : IGovernanceWorkflowService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly ILogger<GovernanceWorkflowService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IGovernanceEnvironmentActivationRepository _activationRepo = activationRepo ?? throw new ArgumentNullException(nameof(activationRepo));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IGovernancePromotionRecordRepository _promotionRepo = promotionRepo ?? throw new ArgumentNullException(nameof(promotionRepo));
    private readonly IGovernanceApprovalRequestRepository _approvalRepo = approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IOptions<GovernanceGateOptions> _governanceGateOptions =
        governanceGateOptions ?? throw new ArgumentNullException(nameof(governanceGateOptions));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private const string OpaqueProdApprovalValidationFailed =
        "Promotion to prod requires an approved approval request that matches the provided run, manifest version, and target environment.";

    private const string OpaqueProdApprovalMismatch = "The approval request does not match the promoted run, manifest version, or target environment.";

    /// <inheritdoc/>
    public async Task<GovernanceApprovalRequest> SubmitApprovalRequestAsync(string runId, string manifestVersion, string sourceEnvironment,
        string targetEnvironment, string requestedBy, string? requestedByActorKey, string? requestComment, bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(manifestVersion);
        ArgumentNullException.ThrowIfNull(sourceEnvironment);
        ArgumentNullException.ThrowIfNull(targetEnvironment);
        ArgumentNullException.ThrowIfNull(requestedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceEnvironment);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetEnvironment);
        ArgumentException.ThrowIfNullOrWhiteSpace(requestedBy);
        if (!GovernanceEnvironmentOrder.IsValidPromotion(sourceEnvironment, targetEnvironment))
            throw new InvalidOperationException($"Governance approval requests must follow environment ordering (dev → test → prod). " +
                                                $"'{sourceEnvironment}' → '{targetEnvironment}' is not a valid step.");
        ArchitectureRunDetail runDetail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken) ?? throw new RunNotFoundException(runId);
        ArchitectureRun run = runDetail.Run;
        GovernanceApprovalRequest request = new()
        {
            RunId = run.RunId,
            ManifestVersion = manifestVersion,
            SourceEnvironment = sourceEnvironment,
            TargetEnvironment = targetEnvironment,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = requestedBy,
            RequestedByActorKey = requestedByActorKey,
            RequestComment = requestComment,
            RequestedUtc = TimeProvider.System.UtcNowDateTime(),
            SlaDeadlineUtc = ComputeSlaDeadlineUtc()
        };
        StampGovernanceScope(request);
        if (dryRun)
        {
            await LogGovernanceDryRunValidationAttemptedForApprovalRequestAsync(requestedBy, runId, manifestVersion, sourceEnvironment, targetEnvironment,
                cancellationToken);
            return request;
        }

        await approvalRepo.CreateAsync(request, cancellationToken);
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Governance.ApprovalRequestSubmitted, requestedBy, request.ApprovalRequestId,
            $"RunId={runId}; ManifestVersion={manifestVersion}; Source={sourceEnvironment}; Target={targetEnvironment}", cancellationToken);
        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid submittedRunGuid) ? submittedRunGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent governanceSubmitted = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceApprovalSubmitted,
            requestedBy,
            requestedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment
                }, AuditJsonSerializationOptions.Instance));
        governanceSubmitted.RunId = auditRunId;
        await LogGovernanceDurableWithRetryAsync(governanceSubmitted,
            $"GovernanceApprovalSubmitted:{LogSanitizer.Sanitize(request.ApprovalRequestId)}", cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation(
                "Governance approval request submitted: ApprovalRequestId={ApprovalRequestId}, RunId={RunId}, ManifestVersion={ManifestVersion}",
                LogSanitizer.Sanitize(request.ApprovalRequestId), LogSanitizer.Sanitize(request.RunId), LogSanitizer.Sanitize(request.ManifestVersion));
        await TryPublishGovernanceApprovalSubmittedAsync(request, cancellationToken);
        return request;
    }

    /// <inheritdoc/>
    public async Task<GovernanceApprovalRequest> ApproveAsync(string approvalRequestId, string reviewedBy, string reviewedByActorKey, string? reviewComment,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestId);
        ArgumentNullException.ThrowIfNull(reviewedBy);
        ArgumentNullException.ThrowIfNull(reviewedByActorKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByActorKey);
        GovernanceApprovalRequest request = await approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken) ??
                                            throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");
        await EnforceSegregationOfDutiesForReviewAsync(request, approvalRequestId, reviewedBy, reviewedByActorKey, cancellationToken);
        if (request.Status is not (GovernanceApprovalStatus.Draft or GovernanceApprovalStatus.Submitted))
        {
            if (string.Equals(request.Status, GovernanceApprovalStatus.Approved, StringComparison.Ordinal))
                throw new GovernanceApprovalReviewConflictException(approvalRequestId, "approve", request.Status);
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' cannot be approved from status '{request.Status}'. " +
                                                "Approve is only valid from Draft or Submitted.");
        }

        DateTime reviewedUtc = TimeProvider.System.UtcNowDateTime();
        bool transitioned = await approvalRepo.TryTransitionFromReviewableAsync(approvalRequestId, GovernanceApprovalStatus.Approved, reviewedBy,
            reviewedByActorKey, reviewComment, reviewedUtc, cancellationToken);
        if (!transitioned)
        {
            GovernanceApprovalRequest? fresh = await approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);
            if (fresh is null)
                throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");
            if (string.Equals(fresh.Status, GovernanceApprovalStatus.Approved, StringComparison.Ordinal))
                throw new GovernanceApprovalReviewConflictException(approvalRequestId, "approve", fresh.Status);
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' cannot be approved from status '{fresh.Status}'. " +
                                                "Approve is only valid from Draft or Submitted.");
        }

        request.Status = GovernanceApprovalStatus.Approved;
        request.ReviewedBy = reviewedBy;
        request.ReviewedByActorKey = reviewedByActorKey;
        request.ReviewComment = reviewComment;
        request.ReviewedUtc = reviewedUtc;
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Governance.ApprovalRequestApproved, reviewedBy, approvalRequestId,
            $"Status={GovernanceApprovalStatus.Approved}", cancellationToken);
        Guid? approvedRunId = Guid.TryParse(request.RunId, out Guid approvedRunGuid) ? approvedRunGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent governanceApproved = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceApprovalApproved,
            reviewedBy,
            reviewedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    reviewedBy,
                    reviewComment = request.ReviewComment
                },
                AuditJsonSerializationOptions.Instance));
        governanceApproved.RunId = approvedRunId;
        await LogGovernanceDurableWithRetryAsync(governanceApproved,
            $"GovernanceApprovalApproved:{LogSanitizer.Sanitize(approvalRequestId)}", cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Governance approval request approved: ApprovalRequestId={ApprovalRequestId}, ReviewedBy={ReviewedBy}",
                LogSanitizer.Sanitize(request.ApprovalRequestId), LogSanitizer.Sanitize(reviewedBy));
        return request;
    }

    /// <inheritdoc/>
    public async Task<GovernanceApprovalRequest> RejectAsync(string approvalRequestId, string reviewedBy, string reviewedByActorKey, string? reviewComment,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestId);
        ArgumentNullException.ThrowIfNull(reviewedBy);
        ArgumentNullException.ThrowIfNull(reviewedByActorKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(approvalRequestId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByActorKey);
        GovernanceApprovalRequest request = await approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken) ??
                                            throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");
        await EnforceSegregationOfDutiesForReviewAsync(request, approvalRequestId, reviewedBy, reviewedByActorKey, cancellationToken);
        if (request.Status is not (GovernanceApprovalStatus.Draft or GovernanceApprovalStatus.Submitted))
        {
            if (string.Equals(request.Status, GovernanceApprovalStatus.Rejected, StringComparison.Ordinal))
                throw new GovernanceApprovalReviewConflictException(approvalRequestId, "reject", request.Status);
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' cannot be rejected from status '{request.Status}'. " +
                                                "Reject is only valid from Draft or Submitted.");
        }

        DateTime reviewedUtc = TimeProvider.System.UtcNowDateTime();
        bool transitioned = await approvalRepo.TryTransitionFromReviewableAsync(approvalRequestId, GovernanceApprovalStatus.Rejected, reviewedBy,
            reviewedByActorKey, reviewComment, reviewedUtc, cancellationToken);
        if (!transitioned)
        {
            GovernanceApprovalRequest? fresh = await approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);
            if (fresh is null)
                throw new InvalidOperationException($"Approval request '{approvalRequestId}' was not found.");
            if (string.Equals(fresh.Status, GovernanceApprovalStatus.Rejected, StringComparison.Ordinal))
                throw new GovernanceApprovalReviewConflictException(approvalRequestId, "reject", fresh.Status);
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' cannot be rejected from status '{fresh.Status}'. " +
                                                "Reject is only valid from Draft or Submitted.");
        }

        request.Status = GovernanceApprovalStatus.Rejected;
        request.ReviewedBy = reviewedBy;
        request.ReviewedByActorKey = reviewedByActorKey;
        request.ReviewComment = reviewComment;
        request.ReviewedUtc = reviewedUtc;
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Governance.ApprovalRequestRejected, reviewedBy, approvalRequestId,
            $"Status={GovernanceApprovalStatus.Rejected}", cancellationToken);
        Guid? rejectedRunId = Guid.TryParse(request.RunId, out Guid rejectedRunGuid) ? rejectedRunGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent governanceRejected = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceApprovalRejected,
            reviewedBy,
            reviewedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    reviewedBy,
                    reviewComment = request.ReviewComment
                },
                AuditJsonSerializationOptions.Instance));
        governanceRejected.RunId = rejectedRunId;
        await LogGovernanceDurableWithRetryAsync(governanceRejected,
            $"GovernanceApprovalRejected:{LogSanitizer.Sanitize(approvalRequestId)}", cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Governance approval request rejected: ApprovalRequestId={ApprovalRequestId}, ReviewedBy={ReviewedBy}",
                LogSanitizer.Sanitize(request.ApprovalRequestId), LogSanitizer.Sanitize(reviewedBy));
        return request;
    }

    /// <inheritdoc/>
    public async Task<GovernancePromotionRecord> PromoteAsync(string runId, string manifestVersion, string sourceEnvironment, string targetEnvironment,
        string promotedBy, string? approvalRequestId, string? notes, bool dryRun = false, bool verbosePromotionValidationErrors = false,
        CancellationToken cancellationToken = default)
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
        ArchitectureRunDetail runDetail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken) ?? throw new RunNotFoundException(runId);
        string persistedRunId = runDetail.Run.RunId;
        if (!GovernanceEnvironmentOrder.IsValidPromotion(sourceEnvironment, targetEnvironment))
            throw new InvalidOperationException($"Promotion must follow environment ordering (dev → test → prod). " +
                                                $"'{sourceEnvironment}' → '{targetEnvironment}' is not a valid promotion step.");
        GovernanceApprovalRequest? prodApprovalToMarkPromoted = null;
        if (string.Equals(targetEnvironment, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(approvalRequestId))
                throw new InvalidOperationException("Promotion to prod requires an approved approval request. Provide an approvalRequestId.");
            GovernanceApprovalRequest? approvalRequest = await approvalRepo.GetByIdAsync(approvalRequestId, cancellationToken);
            ThrowIfProdApprovalChainInvalid(approvalRequest, approvalRequestId, runId, manifestVersion, targetEnvironment, verbosePromotionValidationErrors);
            prodApprovalToMarkPromoted = approvalRequest!;
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
        StampGovernanceScope(record);
        if (dryRun)
        {
            await LogGovernanceDryRunValidationAttemptedForPromotionAsync(promotedBy, persistedRunId, manifestVersion, sourceEnvironment, targetEnvironment,
                approvalRequestId, cancellationToken);
            return record;
        }

        if (prodApprovalToMarkPromoted is not null)
        {
            prodApprovalToMarkPromoted.Status = GovernanceApprovalStatus.Promoted;
            await approvalRepo.UpdateAsync(prodApprovalToMarkPromoted, cancellationToken);
        }

        await promotionRepo.CreateAsync(record, cancellationToken);
        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Governance.ManifestPromoted, promotedBy, record.PromotionRecordId,
            $"RunId={persistedRunId}; ManifestVersion={manifestVersion}; {sourceEnvironment}->{targetEnvironment}", cancellationToken);
        Guid? promotedRunId = Guid.TryParse(record.RunId, out Guid promotedRunGuid) ? promotedRunGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent governancePromoted = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceManifestPromoted,
            promotedBy,
            promotedBy,
            JsonSerializer.Serialize(
                new
                {
                    promotionRecordId = record.PromotionRecordId,
                    runId = record.RunId,
                    manifestVersion = record.ManifestVersion,
                    sourceEnvironment = record.SourceEnvironment,
                    targetEnvironment = record.TargetEnvironment,
                    approvalRequestId = record.ApprovalRequestId
                }, AuditJsonSerializationOptions.Instance));
        governancePromoted.RunId = promotedRunId;
        await LogGovernanceDurableWithRetryAsync(governancePromoted,
            $"GovernanceManifestPromoted:{LogSanitizer.Sanitize(record.PromotionRecordId)}", cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformationGovernanceManifestPromoted(record.PromotionRecordId, record.RunId, record.ManifestVersion, record.TargetEnvironment);
        return record;
    }

    /// <inheritdoc/>
    public async Task<GovernanceEnvironmentActivation> ActivateAsync(string runId, string manifestVersion, string environment, string activatedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(manifestVersion);
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(activatedBy);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(environment);
        ArgumentException.ThrowIfNullOrWhiteSpace(activatedBy);
        ArchitectureRunDetail runDetail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken) ?? throw new RunNotFoundException(runId);
        IReadOnlyList<GovernanceEnvironmentActivation> existing = await activationRepo.GetByEnvironmentAsync(environment, cancellationToken);
        GovernanceEnvironmentActivation activation = new()
        {
            RunId = runDetail.Run.RunId,
            ManifestVersion = manifestVersion,
            Environment = environment,
            IsActive = true,
            ActivatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        StampGovernanceScope(activation);
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);
        IntegrationEventsOptions integrationOpts = integrationEventsOptions.CurrentValue;
        bool enqueuePromotionInSqlTx = integrationOpts.TransactionalOutboxEnabled && uow.SupportsExternalTransaction;
        try
        {
            if (uow.SupportsExternalTransaction)
            {
                foreach (GovernanceEnvironmentActivation active in existing.Where(a => a.IsActive))
                {
                    active.IsActive = false;
                    await activationRepo.UpdateAsync(active, cancellationToken, uow.Connection, uow.Transaction);
                }

                await activationRepo.CreateAsync(activation, cancellationToken, uow.Connection, uow.Transaction);
                if (enqueuePromotionInSqlTx)
                    await TryPublishGovernancePromotionActivatedAsync(activation, activatedBy, uow.Connection, uow.Transaction, cancellationToken);
            }
            else
            {
                foreach (GovernanceEnvironmentActivation active in existing.Where(a => a.IsActive))
                {
                    active.IsActive = false;
                    await activationRepo.UpdateAsync(active, cancellationToken);
                }

                await activationRepo.CreateAsync(activation, cancellationToken);
            }

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        await baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Governance.EnvironmentActivated, activatedBy, activation.ActivationId,
            $"RunId={activation.RunId}; ManifestVersion={manifestVersion}; Environment={environment}", cancellationToken);
        Guid? activationRunId = Guid.TryParse(activation.RunId, out Guid activationRunGuid) ? activationRunGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent governanceActivated = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceEnvironmentActivated,
            activatedBy,
            activatedBy,
            JsonSerializer.Serialize(
                new
                {
                    activationId = activation.ActivationId,
                    runId = activation.RunId,
                    manifestVersion = activation.ManifestVersion,
                    environment = activation.Environment,
                    activatedBy
                }, AuditJsonSerializationOptions.Instance));
        governanceActivated.RunId = activationRunId;
        await LogGovernanceDurableWithRetryAsync(governanceActivated,
            $"GovernanceEnvironmentActivated:{LogSanitizer.Sanitize(activation.ActivationId)}", cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformationGovernanceEnvironmentActivated(activation.ActivationId, activation.RunId, activation.ManifestVersion, activation.Environment);
        if (!enqueuePromotionInSqlTx)
            await TryPublishGovernancePromotionActivatedAsync(activation, activatedBy, null, null, cancellationToken);
        return activation;
    }

    private async Task EnforceSegregationOfDutiesForReviewAsync(GovernanceApprovalRequest request, string approvalRequestId, string reviewedByDisplay,
        string reviewedByActorKey, CancellationToken cancellationToken)
    {
        if (!GovernanceSegregationRules.IsSameActorForReview(request, reviewedByDisplay, reviewedByActorKey))
            return;
        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid runGuid) ? runGuid : null;
        ScopeContext durableScope = scopeContextProvider.GetCurrentScope();
        AuditEvent selfApprovalBlocked = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceSelfApprovalBlocked,
            reviewedByDisplay,
            reviewedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId,
                    requestedBy = request.RequestedBy,
                    requestedByActorKey = request.RequestedByActorKey,
                    attemptedReviewerBy = reviewedByDisplay,
                    attemptedReviewerActorKey = reviewedByActorKey
                }, AuditJsonSerializationOptions.Instance));
        selfApprovalBlocked.RunId = auditRunId;
        await LogGovernanceDurableWithRetryAsync(selfApprovalBlocked,
            $"GovernanceSelfApprovalBlocked:{LogSanitizer.Sanitize(approvalRequestId)}", cancellationToken);
        throw new GovernanceSelfApprovalException(approvalRequestId, reviewedByDisplay);
    }

    private static bool SameArchitectureRunKey(string left, string right)
    {
        if (Guid.TryParse(left, out Guid leftGuid) && Guid.TryParse(right, out Guid rightGuid))
            return leftGuid == rightGuid;
        return string.Equals(left, right, StringComparison.Ordinal);
    }

    private void ThrowIfProdApprovalChainInvalid(GovernanceApprovalRequest? approvalRequest, string approvalRequestId, string runId, string manifestVersion,
        string targetEnvironment, bool verbosePromotionValidationErrors)
    {
        if (approvalRequest?.Status != GovernanceApprovalStatus.Approved)
        {
            if (verbosePromotionValidationErrors)
                throw new InvalidOperationException($"Promotion to prod requires an approved approval request. " +
                                                    $"Approval request '{approvalRequestId}' has status '{approvalRequest?.Status ?? "not found"}'.");
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(
                    "Promotion to prod blocked: approval request {ApprovalRequestId} has status {Status} (expected Approved). CallerRunId={CallerRunId}, CallerManifestVersion={CallerManifestVersion}, TargetEnvironment={TargetEnvironment}.",
                    LogSanitizer.Sanitize(approvalRequestId), approvalRequest?.Status ?? "not found", LogSanitizer.Sanitize(runId),
                    LogSanitizer.Sanitize(manifestVersion), targetEnvironment);
            throw new InvalidOperationException(OpaqueProdApprovalValidationFailed);
        }

        GovernanceApprovalRequest approved = approvalRequest;
        if (!SameArchitectureRunKey(approved.RunId, runId))
        {
            if (verbosePromotionValidationErrors)
                throw new InvalidOperationException($"Approval request '{approvalRequestId}' was issued for run '{approved.RunId}', " +
                                                    $"not '{runId}'. Use an approval request that matches the promoted run.");
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("Promotion to prod blocked: approval request {ApprovalRequestId} run mismatch (stored {StoredRunId}, caller {CallerRunId}).",
                    LogSanitizer.Sanitize(approvalRequestId), LogSanitizer.Sanitize(approved.RunId), LogSanitizer.Sanitize(runId));
            throw new InvalidOperationException(OpaqueProdApprovalMismatch);
        }

        if (!string.Equals(approved.ManifestVersion, manifestVersion, StringComparison.Ordinal))
        {
            if (verbosePromotionValidationErrors)
                throw new InvalidOperationException($"Approval request '{approvalRequestId}' was issued for manifest version '{approved.ManifestVersion}', " +
                                                    $"not '{manifestVersion}'. Use an approval request that matches the promoted manifest version.");
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(
                    "Promotion to prod blocked: approval request {ApprovalRequestId} manifest mismatch (stored {StoredManifestVersion}, caller {CallerManifestVersion}).",
                    LogSanitizer.Sanitize(approvalRequestId), LogSanitizer.Sanitize(approved.ManifestVersion), LogSanitizer.Sanitize(manifestVersion));
            throw new InvalidOperationException(OpaqueProdApprovalMismatch);
        }

        if (string.Equals(approved.TargetEnvironment, targetEnvironment, StringComparison.OrdinalIgnoreCase))
            return;
        if (verbosePromotionValidationErrors)
            throw new InvalidOperationException($"Approval request '{approvalRequestId}' targets environment '{approved.TargetEnvironment}', " +
                                                $"not '{targetEnvironment}'. Use an approval request that matches the target environment.");
        if (logger.IsEnabled(LogLevel.Warning))
            logger.LogWarning(
                "Promotion to prod blocked: approval request {ApprovalRequestId} target environment mismatch (stored {StoredTarget}, caller {CallerTarget}).",
                LogSanitizer.Sanitize(approvalRequestId), LogSanitizer.Sanitize(approved.TargetEnvironment), targetEnvironment);
        throw new InvalidOperationException(OpaqueProdApprovalMismatch);
    }

    private async Task LogGovernanceDryRunValidationAttemptedForApprovalRequestAsync(string requestedBy, string runId, string manifestVersion,
        string sourceEnvironment, string targetEnvironment, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            workflow = "approvalRequest",
            manifestVersion,
            sourceEnvironment,
            targetEnvironment
        },
            AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            requestedBy,
            requestedBy,
            dataJson);
        auditEvent.RunId = auditRunId;
        await DurableAuditLogRetry.TryLogAsync(ct => auditService.LogAsync(auditEvent, ct), logger,
            $"GovernanceDryRunValidationAttempted:approval:{LogSanitizer.Sanitize(runId)}", cancellationToken);
    }

    private async Task LogGovernanceDryRunValidationAttemptedForPromotionAsync(string promotedBy, string runId, string manifestVersion,
        string sourceEnvironment, string targetEnvironment, string? approvalRequestId, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(new
        {
            workflow = "promotion",
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            approvalRequestId
        }, AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            promotedBy,
            promotedBy,
            dataJson);
        auditEvent.RunId = auditRunId;
        await DurableAuditLogRetry.TryLogAsync(ct => auditService.LogAsync(auditEvent, ct), logger,
            $"GovernanceDryRunValidationAttempted:promotion:{LogSanitizer.Sanitize(runId)}", cancellationToken);
    }

    /// <summary>
    ///     Governance durable rows use bounded retries; failures are logged only so workflow state is not blocked by audit
    ///     I/O.
    /// </summary>
    private async Task LogGovernanceDurableWithRetryAsync(AuditEvent auditEvent, string operationLabel, CancellationToken cancellationToken)
    {
        await DurableAuditLogRetry.TryLogAsync(ct => auditService.LogAsync(auditEvent, ct), logger, operationLabel, cancellationToken);
    }

    private Task TryPublishGovernanceApprovalSubmittedAsync(GovernanceApprovalRequest request, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            approvalRequestId = request.ApprovalRequestId,
            runId = request.RunId,
            manifestVersion = request.ManifestVersion,
            sourceEnvironment = request.SourceEnvironment,
            targetEnvironment = request.TargetEnvironment,
            requestedBy = request.RequestedBy
        };
        string messageId = $"{request.ApprovalRequestId}:{IntegrationEventTypes.GovernanceApprovalSubmittedV1}";
        Guid? runKey = Guid.TryParse(request.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(integrationEventOutbox, integrationEventPublisher,
            integrationEventsOptions.CurrentValue, logger, IntegrationEventTypes.GovernanceApprovalSubmittedV1, payload, messageId, runKey, scope.TenantId,
            scope.WorkspaceId, scope.ProjectId, null, null, cancellationToken);
    }

    private DateTime? ComputeSlaDeadlineUtc()
    {
        int? slaHours = governanceGateOptions.Value.ApprovalSlaHours;
        if (slaHours is null or <= 0)
            return null;
        return TimeProvider.System.UtcNowDateTime().AddHours(slaHours.Value);
    }

    private Task TryPublishGovernancePromotionActivatedAsync(GovernanceEnvironmentActivation activation, string activatedBy, IDbConnection? connection,
        IDbTransaction? transaction, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            activationId = activation.ActivationId,
            runId = activation.RunId,
            manifestVersion = activation.ManifestVersion,
            environment = activation.Environment,
            activatedBy,
            activatedUtc = activation.ActivatedUtc
        };
        string messageId = $"{activation.ActivationId}:{IntegrationEventTypes.GovernancePromotionActivatedV1}";
        Guid? runKey = Guid.TryParse(activation.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(integrationEventOutbox, integrationEventPublisher,
            integrationEventsOptions.CurrentValue, logger, IntegrationEventTypes.GovernancePromotionActivatedV1, payload, messageId, runKey, scope.TenantId,
            scope.WorkspaceId, scope.ProjectId, connection, transaction, cancellationToken);
    }

    private void StampGovernanceScope(GovernanceApprovalRequest request)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        if (scope.TenantId == Guid.Empty)
            return;
        request.TenantId = scope.TenantId;
        request.WorkspaceId = scope.WorkspaceId;
        request.ProjectId = scope.ProjectId;
    }

    private void StampGovernanceScope(GovernancePromotionRecord record)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        if (scope.TenantId == Guid.Empty)
            return;
        record.TenantId = scope.TenantId;
        record.WorkspaceId = scope.WorkspaceId;
        record.ProjectId = scope.ProjectId;
    }

    private void StampGovernanceScope(GovernanceEnvironmentActivation activation)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        if (scope.TenantId == Guid.Empty)
            return;
        activation.TenantId = scope.TenantId;
        activation.WorkspaceId = scope.WorkspaceId;
        activation.ProjectId = scope.ProjectId;
    }
}
