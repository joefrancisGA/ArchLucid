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
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using GovernanceGateOptions = ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <inheritdoc cref="IGovernanceWorkflowSubmitStage" />
public sealed class GovernanceWorkflowSubmitStage(
    IGovernanceApprovalRequestRepository approvalRepo,
    IRunDetailQueryService runDetailQueryService,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IBaselineMutationAuditService baselineMutationAudit,
    GovernanceWorkflowAuditSupport auditSupport,
    GovernanceWorkflowIntegrationEventSupport integrationEvents,
    IOptions<GovernanceGateOptions> governanceGateOptions,
    ILogger<GovernanceWorkflowSubmitStage> logger) : IGovernanceWorkflowSubmitStage
{
    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly GovernanceWorkflowAuditSupport _auditSupport =
        auditSupport ?? throw new ArgumentNullException(nameof(auditSupport));

    private readonly GovernanceWorkflowIntegrationEventSupport _integrationEvents =
        integrationEvents ?? throw new ArgumentNullException(nameof(integrationEvents));

    private readonly IOptions<GovernanceGateOptions> _governanceGateOptions =
        governanceGateOptions ?? throw new ArgumentNullException(nameof(governanceGateOptions));

    private readonly ILogger<GovernanceWorkflowSubmitStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<GovernanceApprovalRequest> SubmitAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string requestedBy,
        string? requestedByActorKey,
        string? requestComment,
        bool dryRun,
        CancellationToken cancellationToken)
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
        {
            throw new InvalidOperationException(
                $"Governance approval requests must follow environment ordering (dev → test → prod). " +
                $"'{sourceEnvironment}' → '{targetEnvironment}' is not a valid step.");
        }

        ArchitectureRunDetail runDetail = await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken)
            ?? throw new RunNotFoundException(runId);
        ArchitectureRun run = runDetail.Run;

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
        _auditSupport.StampGovernanceScope(request);

        if (dryRun)
        {
            await _auditSupport.LogDryRunValidationAttemptedForApprovalRequestAsync(
                requestedBy,
                runId,
                manifestVersion,
                sourceEnvironment,
                targetEnvironment,
                cancellationToken);
            return request;
        }

        await _approvalRepo.CreateAsync(request, cancellationToken);
        await _baselineMutationAudit.RecordAsync(
            AuditEventTypes.Baseline.Governance.ApprovalRequestSubmitted,
            requestedBy,
            request.ApprovalRequestId,
            $"RunId={runId}; ManifestVersion={manifestVersion}; Source={sourceEnvironment}; Target={targetEnvironment}",
            cancellationToken);

        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid submittedRunGuid) ? submittedRunGuid : null;
        AuditEvent governanceSubmitted = _auditSupport.CreateGovernanceApprovalSubmittedAuditEvent(request, requestedBy);
        governanceSubmitted.RunId = auditRunId;

        await _auditSupport.LogGovernanceDurableWithRetryAsync(
            governanceSubmitted,
            $"GovernanceApprovalSubmitted:{LogSanitizer.Sanitize(request.ApprovalRequestId)}",
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Governance approval request submitted: ApprovalRequestId={ApprovalRequestId}, RunId={RunId}, ManifestVersion={ManifestVersion}",
                LogSanitizer.Sanitize(request.ApprovalRequestId),
                LogSanitizer.Sanitize(request.RunId),
                LogSanitizer.Sanitize(request.ManifestVersion));
        }

        await _integrationEvents.TryPublishApprovalSubmittedAsync(request, cancellationToken);
        return request;
    }

    private DateTime? ComputeSlaDeadlineUtc()
    {
        int? slaHours = _governanceGateOptions.Value.ApprovalSlaHours;
        if (slaHours is null or <= 0)
            return null;
        return TimeProvider.System.UtcNowDateTime().AddHours(slaHours.Value);
    }
}
