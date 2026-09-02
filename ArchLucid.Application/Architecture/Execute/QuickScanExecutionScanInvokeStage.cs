using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture.Execute;

/// <inheritdoc cref="IQuickScanExecutionScanInvokeStage" />
public sealed class QuickScanExecutionScanInvokeStage(
    IQuickScanService quickScanService,
    IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    ILlmCostEstimator costEstimator,
    TimeProvider timeProvider) : IQuickScanExecutionScanInvokeStage
{
    private readonly IQuickScanService _quickScanService =
        quickScanService ?? throw new ArgumentNullException(nameof(quickScanService));

    private readonly IQuickScanGlobalBudgetReservationService _quickScanGlobalBudgetReservationService =
        quickScanGlobalBudgetReservationService
        ?? throw new ArgumentNullException(nameof(quickScanGlobalBudgetReservationService));

    private readonly IQuickScanGuard _quickScanGuard =
        quickScanGuard ?? throw new ArgumentNullException(nameof(quickScanGuard));

    private readonly IQuickScanTelemetry _quickScanTelemetry =
        quickScanTelemetry ?? throw new ArgumentNullException(nameof(quickScanTelemetry));

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ExecuteAsync(QuickScanExecutionPipelineState state, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(state);

        if (state.TerminalResult is not null)
            return;

        QuickScanRequestValidator.ValidatedQuickScanRequest validated =
            state.Validated ?? throw new InvalidOperationException("Validated request is required before scan invoke.");
        QuickScanGuardContext guardContext =
            state.GuardContext ?? throw new InvalidOperationException("Guard context is required before scan invoke.");
        QuickScanOptions options = state.Options;
        decimal reservedCostUsd = state.ReservedCostUsd;
        Guid? globalBudgetReservationId = state.GlobalBudgetReservationId;
        DateTimeOffset started = state.Started;

        Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(validated);
        QuickScanResult scan;

        using (AmbientAiUsageFeatureScope.Push(AiUsageFeature.QuickScan))
        {
            scan = await _quickScanService.ScanAsync(files, cancellationToken).ConfigureAwait(false);
        }

        ArchitectureQuickScanResponse body = ArchitectureQuickScanResponseMapper.Map(
            scan,
            validated,
            options.MaxFindingsReturned);

        LlmCompletionTokenUsageAmbient.TryPeek(out int? inputTokens, out int? outputTokens, out int? _);
        decimal estimatedCost = _costEstimator.EstimateUsd(inputTokens ?? 0, outputTokens ?? 0, 0, deploymentLabel: null)
            ?? reservedCostUsd;
        TimeSpan duration = _timeProvider.GetUtcNow() - started;

        if (estimatedCost > options.MaxEstimatedCostUsdPerScan)
        {
            if (globalBudgetReservationId.HasValue)
            {
                await _quickScanGlobalBudgetReservationService
                    .ReleaseAsync(globalBudgetReservationId.Value, cancellationToken)
                    .ConfigureAwait(false);
            }

            _quickScanTelemetry.RecordFailure(guardContext, "per_scan_cost_exceeded", duration);
            state.TerminalResult = QuickScanExecutionResult.CapacityReached();

            return;
        }

        if (globalBudgetReservationId.HasValue)
        {
            await _quickScanGlobalBudgetReservationService
                .CommitAsync(globalBudgetReservationId.Value, estimatedCost, cancellationToken)
                .ConfigureAwait(false);
        }

        _quickScanGuard.RecordScanCompleted(
            guardContext,
            succeeded: true,
            estimatedCost,
            inputTokens ?? 0,
            outputTokens ?? 0,
            duration);

        _quickScanTelemetry.RecordSuccess(
            guardContext,
            body.ScanId,
            estimatedCost,
            inputTokens ?? 0,
            outputTokens ?? 0,
            modelLabel: "quick-scan",
            duration);

        state.TerminalResult = QuickScanExecutionResult.Success(body);
        state.ReservedCostUsd = reservedCostUsd;
        state.GlobalBudgetReservationId = globalBudgetReservationId;
        state.ScanDuration = duration;
        state.EstimatedCostUsd = estimatedCost;
        state.InputTokens = inputTokens;
        state.OutputTokens = outputTokens;
        state.ScanResult = scan;
    }
}
