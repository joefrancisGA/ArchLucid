using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture.Execute;

/// <inheritdoc cref="IQuickScanExecutionUsageAndAuditStage" />
public sealed class QuickScanExecutionUsageAndAuditStage(
    IQuickScanUsageRecorder quickScanUsageRecorder,
    IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IAuditService auditService,
    ILogger<QuickScanExecutionUsageAndAuditStage> logger,
    TimeProvider timeProvider) : IQuickScanExecutionUsageAndAuditStage
{
    private readonly IQuickScanUsageRecorder _quickScanUsageRecorder =
        quickScanUsageRecorder ?? throw new ArgumentNullException(nameof(quickScanUsageRecorder));

    private readonly IQuickScanGlobalBudgetReservationService _quickScanGlobalBudgetReservationService =
        quickScanGlobalBudgetReservationService
        ?? throw new ArgumentNullException(nameof(quickScanGlobalBudgetReservationService));

    private readonly IQuickScanGuard _quickScanGuard =
        quickScanGuard ?? throw new ArgumentNullException(nameof(quickScanGuard));

    private readonly IQuickScanTelemetry _quickScanTelemetry =
        quickScanTelemetry ?? throw new ArgumentNullException(nameof(quickScanTelemetry));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<QuickScanExecutionUsageAndAuditStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task RecordSuccessAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(state);

        QuickScanGuardContext guardContext =
            state.GuardContext ?? throw new InvalidOperationException("Guard context is required for usage recording.");
        QuickScanExecutionRequestContext context = state.Context;
        QuickScanRequestValidator.ValidatedQuickScanRequest validated =
            state.Validated ?? throw new InvalidOperationException("Validated request is required for usage recording.");
        QuickScanResult scan =
            state.ScanResult ?? throw new InvalidOperationException("Scan result is required for success usage recording.");

        await RecordUsageAsync(
            guardContext,
            context,
            status: "success",
            reservationId: state.GlobalBudgetReservationId,
            reservedUsd: state.ReservedCostUsd > 0m ? state.ReservedCostUsd : null,
            actualCostUsd: state.EstimatedCostUsd,
            inputTokens: state.InputTokens,
            outputTokens: state.OutputTokens,
            modelLabel: "quick-scan",
            rejectionReason: null,
            duration: state.ScanDuration,
            cancellationToken).ConfigureAwait(false);

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureQuickScanExecuted,
                    ActorUserId = context.AuditActor,
                    ActorUserName = context.AuditActor,
                    TenantId = context.TenantId,
                    WorkspaceId = context.WorkspaceId,
                    ProjectId = context.ProjectId,
                    CorrelationId = context.TraceIdentifier,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            validated.SystemName,
                            validated.PrimaryEnvironment,
                            descriptionLength = validated.Description.Length,
                            concernCount = validated.ArchitectureConcerns.Count,
                            scan.ScanId,
                            findingCount = scan.Findings.Count,
                            summaryLength = scan.Summary.Length
                        },
                        AuditJsonSerializationOptions.Instance)
                },
                ct),
            _logger,
            $"ArchitectureQuickScanExecuted:{context.TraceIdentifier}",
            cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task RecordExecutionFailureAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(state);

        QuickScanGuardContext guardContext =
            state.GuardContext ?? throw new InvalidOperationException("Guard context is required for failure usage recording.");
        QuickScanExecutionRequestContext context = state.Context;
        TimeSpan duration = state.ScanDuration > TimeSpan.Zero
            ? state.ScanDuration
            : _timeProvider.GetUtcNow() - state.Started;

        if (state.GlobalBudgetReservationId.HasValue)
        {
            await _quickScanGlobalBudgetReservationService
                .ReleaseAsync(state.GlobalBudgetReservationId.Value, cancellationToken)
                .ConfigureAwait(false);
        }

        _quickScanTelemetry.RecordFailure(guardContext, "execution_failed", duration);
        _quickScanGuard.RecordScanCompleted(guardContext, succeeded: false, 0m, 0, 0, duration);
        await RecordUsageAsync(
            guardContext,
            context,
            status: "failure",
            reservationId: state.GlobalBudgetReservationId,
            reservedUsd: state.ReservedCostUsd > 0m ? state.ReservedCostUsd : null,
            actualCostUsd: null,
            inputTokens: null,
            outputTokens: null,
            modelLabel: null,
            rejectionReason: "execution_failed",
            duration: duration,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task RecordUsageAsync(
        QuickScanGuardContext guardContext,
        QuickScanExecutionRequestContext requestContext,
        string status,
        Guid? reservationId,
        decimal? reservedUsd,
        decimal? actualCostUsd,
        int? inputTokens,
        int? outputTokens,
        string? modelLabel,
        string? rejectionReason,
        TimeSpan duration,
        CancellationToken cancellationToken)
    {
        try
        {
            QuickScanUsageRecord record = QuickScanUsageRecordFactory.Create(
                guardContext,
                requestContext,
                status,
                reservationId,
                reservedUsd,
                actualCostUsd,
                inputTokens,
                outputTokens,
                modelLabel,
                rejectionReason,
                duration,
                _timeProvider.GetUtcNow());

            await _quickScanUsageRecorder.RecordAsync(record, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Quick Scan usage record persistence failed for status {Status}.", status);
        }
    }
}
