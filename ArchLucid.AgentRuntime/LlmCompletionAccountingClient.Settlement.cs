using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime;

public sealed partial class LlmCompletionAccountingClient
{
    private async Task ReleasePreCallDailyReservationAsync(
        Guid tenantId,
        string providerKind,
        long? dailyReserved,
        bool useJudgeDailyCapOnly)
    {
        if (dailyReserved is null or <= 0)
            return;

        // The monthly preflight failed before reaching the provider. Do not read ambient usage,
        // and preserve the original rejection or cancellation if releasing the daily hold fails.
        try
        {
            if (useJudgeDailyCapOnly)
                await _judgeDailyBudgetTracker!.ReleasePendingReservationIfAnyAsync(
                    tenantId, providerKind, dailyReserved, CancellationToken.None).ConfigureAwait(false);
            else
                await _dailyTenantBudgetTracker.ReleasePendingReservationIfAnyAsync(
                    tenantId, providerKind, dailyReserved, CancellationToken.None).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _telemetry.LogPreCallReservationReleaseFailure(ex, useJudgeDailyCapOnly ? "judge daily" : "daily");
        }
    }

    private async Task SettleMeasuredCompletionUsageAsync(
        ScopeContext scope,
        string providerKind,
        int promptTok,
        int completionTok,
        int reasoningTok,
        int cachedPromptTok,
        long? dailyReserved,
        decimal? monthlyReserved,
        bool overageActive,
        bool useJudgeDailyCapOnly)
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts billable =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(promptTok, completionTok, reasoningTok);

        _quotaTracker.RecordUsage(scope.TenantId, promptTok, completionTok);

        if (useJudgeDailyCapOnly)
        {
            await _judgeDailyBudgetTracker!
                .RecordUsageAsync(
                    scope.TenantId,
                    providerKind,
                    promptTok,
                    completionTok,
                    dailyReserved,
                    CancellationToken.None)
                .ConfigureAwait(false);
        }
        else
        {
            await _dailyTenantBudgetTracker
                .RecordUsageAndMaybeWarnAsync(
                    scope.TenantId,
                    providerKind,
                    _scopeProvider,
                    _auditService,
                    promptTok,
                    completionTok,
                    reasoningTok,
                    dailyReserved,
                    CancellationToken.None)
                .ConfigureAwait(false);
        }

        await _monthlyDollarBudgetTracker
            .RecordUsageAndMaybeWarnAsync(
                scope.TenantId,
                providerKind,
                _scopeProvider,
                _auditService,
                promptTok,
                completionTok,
                reasoningTok,
                monthlyReserved,
                overageActive,
                CancellationToken.None)
            .ConfigureAwait(false);

        await _telemetry
            .RecordTokenUsageAsync(scope, promptTok, completionTok, cachedPromptTok, CancellationToken.None)
            .ConfigureAwait(false);

        decimal? estimatedUsd = LlmCompletionUsageBillingNormalization.HasMeasurableUsage(billable)
            ? _costEstimator.EstimateUsd(billable.Prompt, billable.Output, billable.Reasoning)
            : null;

        await _aiBudgetPreCallGuard
            .RecordCompletionAsync(
                scope.TenantId,
                AmbientAiUsageFeatureScope.Current,
                providerKind,
                promptTok,
                completionTok,
                estimatedUsd,
                correlationId: null,
                actorUserId: null,
                CancellationToken.None)
            .ConfigureAwait(false);
    }
}
