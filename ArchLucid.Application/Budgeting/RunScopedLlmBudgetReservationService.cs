using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Budgeting;

/// <inheritdoc cref="IRunScopedLlmBudgetReservationService" />
public sealed class RunScopedLlmBudgetReservationService(
    IOptionsMonitor<RunScopedLlmBudgetReservationOptions> reservationOptionsMonitor,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyBudgetOptionsMonitor,
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    ILlmCostEstimator costEstimator,
    ILlmTenantBudgetRepository budgetRepository,
    IRunScopedLlmBudgetReservationStore reservationStore,
    TimeProvider timeProvider,
    ILogger<RunScopedLlmBudgetReservationService> logger) : IRunScopedLlmBudgetReservationService
{
    private readonly IOptionsMonitor<RunScopedLlmBudgetReservationOptions> _reservationOptionsMonitor =
        reservationOptionsMonitor ?? throw new ArgumentNullException(nameof(reservationOptionsMonitor));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _monthlyBudgetOptionsMonitor =
        monthlyBudgetOptionsMonitor ?? throw new ArgumentNullException(nameof(monthlyBudgetOptionsMonitor));

    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IRunScopedLlmBudgetReservationStore _reservationStore =
        reservationStore ?? throw new ArgumentNullException(nameof(reservationStore));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<RunScopedLlmBudgetReservationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<RunScopedLlmBudgetAdmitResult> AdmitBeforeAgentBatchAsync(
        Guid tenantId,
        string runId,
        int agentTaskCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);

        RunScopedLlmBudgetReservationOptions options = _reservationOptionsMonitor.CurrentValue;

        if (!options.Enabled)
        {
            return RunScopedLlmBudgetAdmitResult.PassThrough();
        }

        LlmMonthlyTenantDollarBudgetOptions monthly = _monthlyBudgetOptionsMonitor.CurrentValue;
        AgentOutputQualityGateOptions gate = _agentOutputQualityGateOptions.Value;

        int assumedPrompt = Math.Clamp(monthly.AssumedMaxPromptTokensPerRequest, 1, 1_000_000);
        int assumedCompletion = Math.Clamp(monthly.AssumedMaxCompletionTokensPerRequest, 1, 262_144);
        decimal assumedUsdPerCall = _costEstimator.EstimateUsd(assumedPrompt, assumedCompletion) ?? 0m;
        int assumedCallsPerAgentTask = Math.Max(0, options.AssumedCallsPerAgentTask);

        decimal estimateUsd = RunAgentBatchBudgetEstimator.EstimateBatchUsd(
            agentTaskCount,
            assumedCallsPerAgentTask,
            assumedUsdPerCall);

        long estimateTokens = RunAgentBatchBudgetEstimator.EstimateBatchTokens(
            agentTaskCount,
            assumedCallsPerAgentTask,
            assumedPrompt,
            assumedCompletion);

        if (gate.MaxCostPerRun is decimal maxCostPerRun && estimateUsd > maxCostPerRun)
        {
            return RunScopedLlmBudgetAdmitResult.Reject(RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded);
        }

        if (gate.MaxTokensPerRun is int maxTokensPerRun && estimateTokens > maxTokensPerRun)
        {
            return RunScopedLlmBudgetAdmitResult.Reject(RunScopedLlmBudgetAdmitRejectionReason.RunCostBudgetExceeded);
        }

        if (!monthly.Enabled || monthly.HardCutoffUsdPerUtcMonth < 0.01m)
        {
            return RunScopedLlmBudgetAdmitResult.PassThrough();
        }

        DateTimeOffset utcNow = _timeProvider.GetUtcNow();
        string periodKey = FormatUtcMonthKey(utcNow.UtcDateTime);

        try
        {
            LlmTenantBudgetStateReadModel state = await _budgetRepository
                .GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                .ConfigureAwait(false);

            decimal hardCap = monthly.HardCutoffUsdPerUtcMonth + state.PurchasedCapBumpUsd;
            decimal pressure = state.TotalUsdPressure;
            decimal graceCeiling = RunAgentBatchBudgetEstimator.ApplyGrace(hardCap, options.AccountingGracePercent);

            if (pressure + estimateUsd > graceCeiling)
            {
                return RunScopedLlmBudgetAdmitResult.Reject(RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded);
            }

            Guid reservationId = Guid.NewGuid();
            string idempotencyKey = $"{tenantId:N}:{runId}:execute";

            RunScopedLlmBudgetReservationRequest request = new()
            {
                ReservationId = reservationId,
                TenantId = tenantId,
                RunId = runId,
                IdempotencyKey = idempotencyKey,
                PeriodKey = periodKey,
                UtcNow = utcNow,
                ReserveUsd = estimateUsd,
                CurrentPressureUsd = pressure,
                HardCapUsd = hardCap,
                AccountingGracePercent = options.AccountingGracePercent,
                ReservationTtl = TimeSpan.FromMinutes(Math.Max(1, options.ReservationTtlMinutes)),
            };

            RunScopedLlmBudgetReservationStoreResult storeResult =
                await _reservationStore.TryReserveAsync(request, cancellationToken).ConfigureAwait(false);

            if (!storeResult.Allowed)
            {
                RunScopedLlmBudgetAdmitRejectionReason reason = storeResult.RejectionReason switch
                {
                    RunScopedLlmBudgetReservationStoreRejectionReason.MonthlyCeilingExceeded =>
                        RunScopedLlmBudgetAdmitRejectionReason.MonthlyQuotaExceeded,
                    RunScopedLlmBudgetReservationStoreRejectionReason.StoreUnavailable =>
                        RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable,
                    _ => RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable,
                };

                return RunScopedLlmBudgetAdmitResult.Reject(reason);
            }

            Guid heldReservationId = storeResult.ReservationId ?? reservationId;

            _logger.LogInformation(
                "Run-scoped LLM budget reserved {ReservationId} for run {RunId} ({ReserveUsd} USD).",
                heldReservationId,
                runId,
                estimateUsd);

            return RunScopedLlmBudgetAdmitResult.Permit(heldReservationId, estimateUsd);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Run-scoped LLM budget reservation failed for tenant {TenantId} run {RunId}.",
                tenantId,
                runId);

            return RunScopedLlmBudgetAdmitResult.Reject(RunScopedLlmBudgetAdmitRejectionReason.StoreUnavailable);
        }
    }

    /// <inheritdoc />
    public Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
        {
            return Task.CompletedTask;
        }

        return _reservationStore.CommitAsync(reservationId, actualUsd, cancellationToken);
    }

    /// <inheritdoc />
    public Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        if (reservationId == Guid.Empty)
        {
            return Task.CompletedTask;
        }

        return _reservationStore.ReleaseAsync(reservationId, cancellationToken);
    }

    private static string FormatUtcMonthKey(DateTime utc) =>
        string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utc.Year, utc.Month);
}
