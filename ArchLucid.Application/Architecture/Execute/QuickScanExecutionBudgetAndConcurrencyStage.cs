using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture.Execute;

/// <inheritdoc cref="IQuickScanExecutionBudgetAndConcurrencyStage" />
public sealed class QuickScanExecutionBudgetAndConcurrencyStage(
    IQuickScanCostEstimator quickScanCostEstimator,
    IQuickScanDistributedConcurrencyService quickScanDistributedConcurrencyService,
    IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IQuickScanSafetyOperationalStateProvider quickScanSafetyOperationalStateProvider,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    TimeProvider timeProvider) : IQuickScanExecutionBudgetAndConcurrencyStage
{
    private readonly IQuickScanCostEstimator _quickScanCostEstimator =
        quickScanCostEstimator ?? throw new ArgumentNullException(nameof(quickScanCostEstimator));

    private readonly IQuickScanDistributedConcurrencyService _quickScanDistributedConcurrencyService =
        quickScanDistributedConcurrencyService
        ?? throw new ArgumentNullException(nameof(quickScanDistributedConcurrencyService));

    private readonly IQuickScanGlobalBudgetReservationService _quickScanGlobalBudgetReservationService =
        quickScanGlobalBudgetReservationService
        ?? throw new ArgumentNullException(nameof(quickScanGlobalBudgetReservationService));

    private readonly IQuickScanSafetyOperationalStateProvider _quickScanSafetyOperationalStateProvider =
        quickScanSafetyOperationalStateProvider
        ?? throw new ArgumentNullException(nameof(quickScanSafetyOperationalStateProvider));

    private readonly IQuickScanGuard _quickScanGuard =
        quickScanGuard ?? throw new ArgumentNullException(nameof(quickScanGuard));

    private readonly IQuickScanTelemetry _quickScanTelemetry =
        quickScanTelemetry ?? throw new ArgumentNullException(nameof(quickScanTelemetry));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(state);

        QuickScanExecutionRequestContext context = state.Context;
        QuickScanRequestValidator.ValidatedQuickScanRequest validated =
            state.Validated ?? throw new InvalidOperationException("Validated request is required before budget stage.");
        QuickScanGuardContext guardContext =
            state.GuardContext ?? throw new InvalidOperationException("Guard context is required before budget stage.");
        QuickScanSafetyOptions safetyOptions = state.SafetyOptions;

        DateTimeOffset started = _timeProvider.GetUtcNow();
        state.Started = started;
        decimal reservedCostUsd = 0m;
        Guid? globalBudgetReservationId = null;

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanCostEstimateResult costReservation = _quickScanCostEstimator.TryReserveCost(
                validated,
                context.ClientRequestedModelId,
                started);

            if (!costReservation.Allowed)
            {
                if (costReservation.RejectionReason == QuickScanCostEstimateRejectionReason.ClientModelOverrideRejected)
                {
                    state.TerminalResult =
                        QuickScanExecutionResult.ValidationFailed("Client model selection is not permitted for Quick Scan.");

                    return;
                }

                _quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"pre_exec_cost_{costReservation.RejectionReason}",
                    TimeSpan.Zero);

                state.TerminalResult = QuickScanExecutionResult.CapacityReached();

                return;
            }

            reservedCostUsd = costReservation.Reservation!.TotalReservedUsd;
            state.ReservedCostUsd = reservedCostUsd;
        }

        QuickScanDistributedConcurrencyAdmissionResult concurrencyAdmission =
            context.RequiresAnonymousDistributedConcurrency
                ? await _quickScanDistributedConcurrencyService
                    .WaitForAdmissionAsync(context.TraceIdentifier, cancellationToken)
                    .ConfigureAwait(false)
                : QuickScanDistributedConcurrencyAdmissionResult.NoOp();
        state.ConcurrencyAdmission = concurrencyAdmission;

        if (!concurrencyAdmission.Allowed)
        {
            _quickScanTelemetry.RecordFailure(
                guardContext,
                $"concurrency_{concurrencyAdmission.RejectionReason}",
                TimeSpan.Zero);

            if (concurrencyAdmission.RejectionReason == QuickScanConcurrencyRejectionReason.EmergencyDisabled)
            {
                QuickScanSafetyOperationalSnapshot operational =
                    await _quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

                state.TerminalResult = QuickScanExecutionResult.EmergencyDisabled(
                    string.IsNullOrWhiteSpace(operational.PublicMessage)
                        ? "Quick Scan is temporarily unavailable."
                        : operational.PublicMessage);

                return;
            }

            state.TerminalResult =
                QuickScanExecutionResult.ConcurrencyRejected(concurrencyAdmission.RejectionReason!.Value);

            return;
        }

        if (safetyOptions.Enabled && context.RequiresAnonymousDistributedConcurrency)
        {
            QuickScanGlobalBudgetReservationAttemptResult budgetReservation =
                await _quickScanGlobalBudgetReservationService.TryReserveAsync(
                    context.TraceIdentifier,
                    reservedCostUsd,
                    started,
                    cancellationToken).ConfigureAwait(false);

            if (!budgetReservation.Allowed)
            {
                _quickScanTelemetry.RecordFailure(
                    guardContext,
                    $"global_budget_{budgetReservation.RejectionReason}",
                    TimeSpan.Zero);

                state.TerminalResult = QuickScanExecutionResult.CapacityReached();

                return;
            }

            globalBudgetReservationId = budgetReservation.ReservationId;
            state.GlobalBudgetReservationId = globalBudgetReservationId;
        }

        _quickScanGuard.RecordScanStarted(guardContext);

        QuickScanSafetyOperationalSnapshot preProviderOperational =
            await _quickScanSafetyOperationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        if (context.RequiresAnonymousDistributedConcurrency && !preProviderOperational.AnonymousExecutionAllowed)
        {
            state.TerminalResult = QuickScanExecutionResult.EmergencyDisabled(
                string.IsNullOrWhiteSpace(preProviderOperational.PublicMessage)
                    ? "Quick Scan is temporarily unavailable."
                    : preProviderOperational.PublicMessage);
        }
    }
}
