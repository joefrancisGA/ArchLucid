using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime;

public sealed partial class LlmCompletionAccountingClient
{
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string providerKind = _inner.Descriptor.ProviderKind;

        AiBudgetPreCallGuardResult guardResult = await _aiBudgetPreCallGuard
            .EnsureAllowedAsync(
                scope.TenantId,
                AmbientAiUsageFeatureScope.Current,
                providerKind,
                systemPrompt,
                userPrompt,
                correlationId: null,
                actorUserId: null,
                cancellationToken)
            .ConfigureAwait(false);

        if (guardResult.ServedFromDemoCache && !string.IsNullOrWhiteSpace(guardResult.CachedResponseJson))
        {
            return guardResult.CachedResponseJson;
        }

        _spendCapPolicy?.EnsureBilledAttemptAllowed();

        long? dailyReserved = null;
        decimal? monthlyReserved = null;
        bool overageActive = false;

        try
        {
            if (_useJudgeDailyCapOnly)
            {
                if (_judgeDailyBudgetOptions!.CurrentValue.Enabled)
                    dailyReserved = await _judgeDailyBudgetTracker!
                        .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                        .ConfigureAwait(false);
            }
            else if (_dailyTenantBudgetOptions.CurrentValue.Enabled)
                dailyReserved = await _dailyTenantBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_monthlyDollarBudgetOptions.CurrentValue.Enabled)
                (monthlyReserved, overageActive) = await _monthlyDollarBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_quotaOptions.CurrentValue.Enabled)
                _quotaTracker.EnsureWithinQuotaBeforeCall(scope.TenantId);
        }
        catch (LlmTokenQuotaExceededException)
        {
            if (_useJudgeDailyCapOnly)
                _judgeDailyBudgetTracker!.RecordBudgetExhausted();
            else
                ArchLucidInstrumentation.LlmQuotaExceededTotal.Add(1);

            throw;
        }

        LlmPromptRedactionOptions redactionOpts = _redactionOptions.CurrentValue;
        string outboundSystem = systemPrompt;
        string outboundUser = userPrompt;

        if (!redactionOpts.Enabled)
        {
            ArchLucidInstrumentation.RecordLlmPromptRedactionSkipped();
        }
        else
        {
            PromptRedactionOutcome systemOutcome = _promptRedactor.Redact(systemPrompt);
            PromptRedactionOutcome userOutcome = _promptRedactor.Redact(userPrompt);

            foreach (KeyValuePair<string, int> kv in systemOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            foreach (KeyValuePair<string, int> kv in userOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            outboundSystem = systemOutcome.Text;
            outboundUser = userOutcome.Text;
        }

        try
        {
            string completion =
                await _inner.CompleteJsonAsync(outboundSystem, outboundUser, maxTokens, temperature, cancellationToken);

            if (_aiUsageControlsOptions.CurrentValue.DemoMode)
            {
                _demoPromptCache.Set(
                    DemoAiPromptCacheKeys.Build(systemPrompt, userPrompt),
                    completion);
            }

            return completion;
        }
        finally
        {
            // Peek (do not consume): schema remediation trace recording and CostGuardrailInterceptor
            // read the same ambient usage after this decorator returns.
            bool usageAvailable = AzureOpenAiCompletionClient.TryPeekLastCompletionTokenUsage(out int promptTok,
                out int completionTok,
                out int reasoningTok,
                out int cachedPromptTok);

            if (!usageAvailable)
            {
                if (_useJudgeDailyCapOnly)
                {
                    await _judgeDailyBudgetTracker!
                        .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                        .ConfigureAwait(false);
                }
                else
                {
                    await _dailyTenantBudgetTracker
                        .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                        .ConfigureAwait(false);
                }

                await _monthlyDollarBudgetTracker
                    .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, monthlyReserved, overageActive, CancellationToken.None)
                    .ConfigureAwait(false);
            }
            else
            {
                _ = reasoningTok;

                _quotaTracker.RecordUsage(scope.TenantId, promptTok, completionTok);

                if (_useJudgeDailyCapOnly)
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
                        monthlyReserved,
                        overageActive,
                        CancellationToken.None)
                    .ConfigureAwait(false);

                await _telemetry
                    .RecordTokenUsageAsync(scope, promptTok, completionTok, cachedPromptTok, CancellationToken.None)
                    .ConfigureAwait(false);

                decimal? estimatedUsd = _costEstimator.EstimateUsd(promptTok, completionTok);

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
    }
}
