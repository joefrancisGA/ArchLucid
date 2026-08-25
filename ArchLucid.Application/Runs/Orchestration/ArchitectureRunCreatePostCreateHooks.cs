using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Best-effort post-create side effects after a run row is persisted (audit, metering, policy baseline, identity link).
/// </summary>
public sealed class ArchitectureRunCreatePostCreateHooks(
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IUsageMeteringService usageMetering,
    TimeProvider timeProvider,
    DefaultPolicyPackCloudBaselineApplicator defaultPolicyPackCloudBaselineApplicator,
    IArchitectureIdentityService architectureIdentityService,
    ILogger<ArchitectureRunCreatePostCreateHooks> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly DefaultPolicyPackCloudBaselineApplicator _defaultPolicyPackCloudBaselineApplicator =
        defaultPolicyPackCloudBaselineApplicator ?? throw new ArgumentNullException(nameof(defaultPolicyPackCloudBaselineApplicator));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

    private readonly ILogger<ArchitectureRunCreatePostCreateHooks> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IUsageMeteringService _usageMetering =
        usageMetering ?? throw new ArgumentNullException(nameof(usageMetering));

    public async Task ExecuteAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        string actor,
        CancellationToken cancellationToken)
    {
        ScopeContext scopeCtx = _scopeContextProvider.GetCurrentScope();

        if (!TryParseCoordinationRunGuid(coordination.Run.RunId, out Guid runGuid))
            runGuid = Guid.Empty;

        AuditEvent requestCreated = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestCreated,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    systemName = request.SystemName,
                    environment = request.Environment,
                    cloudProvider = request.CloudProvider.ToString()
                },
                AuditJsonSerializationOptions.Instance));
        requestCreated.RunId = runGuid == Guid.Empty ? null : runGuid;
        requestCreated.ExplicitActor = true;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestCreated, ct),
            _logger,
            $"{AuditEventTypes.RequestCreated}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestCreated);

        AuditEvent requestLocked = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestLocked,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    rationale =
                        "Run persisted for this ArchitectureRequest — request is scoped as locked relative to drafts until terminal runs settle."
                },
                AuditJsonSerializationOptions.Instance));
        requestLocked.RunId = runGuid == Guid.Empty ? null : runGuid;
        requestLocked.ExplicitActor = true;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestLocked, ct),
            _logger,
            $"{AuditEventTypes.RequestLocked}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestLocked);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Architecture run created: RunId={RunId}, TaskCount={TaskCount}",
                LogSanitizer.Sanitize(coordination.Run.RunId),
                coordination.Tasks.Count);
        }

        await TryRecordArchitectureRunMeteringAsync(scopeCtx, coordination.Run.RunId, cancellationToken);
        await TryApplyCloudPolicyPackBaselineAsync(request, cancellationToken);
        await TryLinkReviewRunArchitectureIdentityAsync(request, coordination.Run.RunId, cancellationToken);
    }

    private async Task TryLinkReviewRunArchitectureIdentityAsync(
        ArchitectureRequest request,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseCoordinationRunGuid(runId, out Guid reviewRunGuid))
            return;

        try
        {
            await _architectureIdentityService
                .TryEnsureReviewRunLinkedAsync(_scopeContextProvider.GetCurrentScope(), reviewRunGuid, request, cancellationToken: cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Review run architecture identity link failed for RunId={RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    private async Task TryApplyCloudPolicyPackBaselineAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            await _defaultPolicyPackCloudBaselineApplicator.TryApplyAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request.CloudProvider,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Cloud policy pack baseline adjustment failed for architecture run (CloudProvider={CloudProvider}).",
                    request.CloudProvider);
            }
        }
    }

    private async Task TryRecordArchitectureRunMeteringAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            await _usageMetering
                .RecordAsync(
                    new UsageEvent
                    {
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        Kind = UsageMeterKind.ArchitectureRun,
                        Quantity = 1,
                        RecordedUtc = _timeProvider.GetUtcNow(),
                        CorrelationId = runId,
                        IdempotencyKey = UsageEventIdempotencyKeys.ForArchitectureRun(runId)
                    },
                    cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Usage metering failed for architecture run (tenant {TenantId}).", scope.TenantId);
        }
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
